Topup Game - Manual payment via Telegram @lindaa2410

How it works:
- Users create orders from frontend.
- Instead of online payment gateway, instructions show Telegram @lindaa2410.
- Admin verifies payment in Telegram then clicks "Mark Paid" in Admin panel.
- System attempts to auto-fulfill via configured provider (IAK) after marking paid.

Deploy quick steps:
1. Copy .env.example -> .env and fill DB + IAK keys.
2. Run docker-compose up -d --build
3. Visit frontend, register user, create order, and test admin flow.
