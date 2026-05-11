function requireLogin(req, res, next) {
  if (!req.session.userId) {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      res.status(401).json({ error: 'Ikke logget ind' });
      return;
    }
    res.redirect('/auth/login');
    return;
  }
  next();
}

module.exports = { requireLogin };
