const adminOnly = (req, res, next) => {
  if (req.user && req.user.email) {
    const email = req.user.email.trim().toLowerCase();
    if (email.includes('premkardani2006') || email.includes('panchaldhyan007')) {
      return next();
    }
  }
  
  return res.status(403).json({
    success: false,
    error: 'Access denied: Administrative privileges required'
  });
};

module.exports = { adminOnly };
