const adminOnly = (req, res, next) => {
  const allowedAdmins = ['premkardani2006@gmail.com', 'panchaldhyan007@gmail.com'];
  
  if (req.user && allowedAdmins.includes(req.user.email)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'Access denied: Administrative privileges required'
  });
};

module.exports = { adminOnly };
