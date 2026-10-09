const jwt = require('jsonwebtoken');

// checking if user is authenticated (token is valid)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нет доступа. Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1]; // cut "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // save user info from token to req.user for further use in controllers
    next(); // skip
  } catch (error) {
    return res.status(403).json({ error: 'Неверный или просроченный токен' });
  }
};

// (roleGuard)
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    // check if user is authenticated first
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Доступ запрещен. Ваша роль: ${req.user.role}. Требуется: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, roleGuard };