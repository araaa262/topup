-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP
);

-- games
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider_code TEXT,
  created_at TIMESTAMP
);

-- packages
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  sku_code TEXT,
  title TEXT,
  price_idr INTEGER,
  provider_product_code TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  package_id INTEGER REFERENCES packages(id),
  player_id TEXT,
  amount INTEGER,
  status TEXT,
  provider_tx_id TEXT,
  provider_response JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  gateway TEXT,
  gateway_tx_id TEXT,
  status TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP
);

-- admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action TEXT,
  target_table TEXT,
  target_id INTEGER,
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
