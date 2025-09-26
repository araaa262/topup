import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authMiddlewareFactory from './middleware/auth.js';
import isAdmin from './middleware/isAdmin.js';
import { sendTopup } from './services/provider.js';

dotenv.config();
const app = express();
app.use(bodyParser.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'example'}@${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'topup'}` });
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const authMiddleware = authMiddlewareFactory(pool, JWT_SECRET);

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users(email,name,password_hash,role,created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING id,email,name,role', [email, name || null, hash, 'user']);
    const user = r.rows[0];
    res.json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query('SELECT id,email,name,password_hash,role FROM users WHERE email=$1', [email]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// List games + packages
app.get('/api/games', async (req, res) => {
  const r = await pool.query('SELECT g.id as game_id,g.name as game_name,p.id as package_id,p.title,p.price_idr FROM games g JOIN packages p ON p.game_id=g.id WHERE p.active=TRUE ORDER BY g.name');
  res.json({ data: r.rows });
});

// Create order - MANUAL PAYMENT VIA TELEGRAM
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { package_id, player_id } = req.body;
    if (!package_id || !player_id) return res.status(400).json({ error: 'package_id & player_id required' });
    const pkg = await pool.query('SELECT id,price_idr FROM packages WHERE id=$1 AND active=TRUE', [package_id]);
    if (!pkg.rows.length) return res.status(400).json({ error: 'package not found' });
    const price = pkg.rows[0].price_idr;
    const newOrder = await pool.query("INSERT INTO orders(user_id,package_id,amount,status,player_id,created_at) VALUES($1,$2,$3,'waiting_manual_payment',$4,NOW()) RETURNING *", [userId, package_id, price, player_id]);
    const order = newOrder.rows[0];
    const instructions = {
      method: 'manual_telegram',
      text: 'Silakan bayar via Telegram ke @lindaa2410. Setelah transfer, chat admin dan minta verifikasi. Contoh pesan: "Pembayaran Topup Order #'+order.id+' - Rp '+order.amount+'"',
      telegram_url: 'https://t.me/lindaa2410',
      telegram_username: '@lindaa2410'
    };
    // insert a payment row to keep record of pending manual payment
    await pool.query('INSERT INTO payments(order_id,gateway,status,created_at) VALUES($1,$2,$3,NOW())', [order.id, 'manual_telegram', 'pending']);
    res.json({ order, payment_instructions: instructions });
  } catch (err) {
    console.error('create order err', err);
    res.status(500).json({ error: 'failed create order' });
  }
});

// Admin: mark order as paid after manual verification
app.post('/api/admin/orders/:id/markPaid', authMiddleware, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    // update payments table: set manual payment to success
    await pool.query('UPDATE payments SET status=$1, raw_payload=$2 WHERE order_id=$3 AND gateway=$4', ['success', JSON_BUILD_OBJECT('marked_by', req.user.id, 'note', req.body.note || null), id, 'manual_telegram']);
    // update order status to paid
    await pool.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', ['paid', id]);
    // log admin action
    await pool.query('INSERT INTO admin_logs(admin_id,action,target_table,target_id,meta) VALUES($1,$2,$3,$4,$5)', [req.user.id, 'mark_paid_manual', 'orders', id, JSON_BUILD_OBJECT('note', req.body.note || null)]);
    // fetch order to process fulfillment
    const r = await pool.query('SELECT * FROM orders WHERE id=$1', [id]);
    const order = r.rows[0];
    // attempt auto-fulfill via provider if configured
    try {
      const pkgRes = await pool.query('SELECT * FROM packages WHERE id=$1',[order.package_id]);
      const packageData = pkgRes.rows[0] || null;
      const gameRes = await pool.query('SELECT * FROM games WHERE id=$1',[packageData?.game_id]);
      const game = gameRes.rows[0] || null;
      if (packageData) {
        const providerResp = await sendTopup(order, game, packageData);
        await pool.query('UPDATE orders SET provider_tx_id=$1, provider_response=$2, status=$3, updated_at=NOW() WHERE id=$4', [providerResp.transaction_id || null, JSON.stringify(providerResp), 'success', id]);
      }
    } catch (pfErr) {
      console.error('provider fulfill err', pfErr);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('markPaid err', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Admin list orders (basic)
app.get('/api/admin/orders', authMiddleware, isAdmin, async (req, res) => {
  const q = await pool.query('SELECT o.*, u.email AS user_email, p.title AS package_title FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN packages p ON p.id=o.package_id ORDER BY o.created_at DESC LIMIT 200');
  res.json({ data: q.rows });
});

app.use((req,res)=> res.status(404).json({error:'not found'}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening ${PORT}`));
