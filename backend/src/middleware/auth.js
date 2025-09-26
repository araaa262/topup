import jwt from 'jsonwebtoken';
export default function(pool, JWT_SECRET){
  return async function (req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'no token' });
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const r = await pool.query('SELECT id,email,name,role FROM users WHERE id=$1', [decoded.id]);
      req.user = r.rows[0];
      next();
    } catch(e){
      return res.status(401).json({ error: 'invalid token' });
    }
  }
}
