export default function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauth' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}
