const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'cloudshield_zerotrust_secret_key_987654321'
      );

      // Get user from the token, omitting the password
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in system' });
      }

      if (req.user.status === 'blocked') {
        return res.status(403).json({ message: 'Your user account has been blocked by administrators.' });
      }

      next();
    } catch (error) {
      logger.error(`Auth token validation failed: ${error.message}`);
      res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
