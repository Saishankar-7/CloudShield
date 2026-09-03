const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token || req.query.t) {
    // Support token query parameter for iframe and media streaming
    token = req.query.token || req.query.t;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'cloudshield_zerotrust_secret_key_987654321'
      );

      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in system' });
      }

      if (req.user.status === 'blocked') {
        return res.status(403).json({ message: 'Your user account has been blocked by administrators.' });
      }

      return next();
    } catch (error) {
      logger.error(`Auth token validation failed: ${error.message}`);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
