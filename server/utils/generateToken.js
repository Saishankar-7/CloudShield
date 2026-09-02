const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'cloudshield_zerotrust_secret_key_987654321';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
