const User = require('../models/User');
const loggingService = require('../services/loggingService');
const logger = require('../utils/logger');

// Generate realistic employee ID
const generateEmployeeId = async () => {
  const count = await User.countDocuments();
  return `EMP-2026-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Get all users (Admin operation)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ fullName: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user directories' });
  }
};

/**
 * Get single user by ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user details' });
  }
};

/**
 * Create a new user (Admin operation)
 */
const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, department, jobTitle, phone, workLocation, employeeType, riskScore } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const employeeId = await generateEmployeeId();

    const user = new User({
      employeeId,
      fullName,
      email,
      password: password || 'password123',
      role: role || 'employee',
      department: department || 'Engineering',
      jobTitle: jobTitle || 'Software Engineer',
      phone: phone || '',
      workLocation: workLocation || 'India',
      employeeType: employeeType || 'Full Time',
      riskScore: riskScore !== undefined ? parseInt(riskScore, 10) : 10,
    });

    // Auto-create default trusted device
    user.trustedDevices.push({
      deviceId: 'device-' + Math.random().toString(36).substring(2, 10),
      deviceName: 'Admin Registered Device',
      browser: 'Chrome',
      os: 'Windows',
      ip: '192.168.1.10',
      location: workLocation || 'India',
      isTrusted: true,
    });

    await user.save();

    // Log the admin action in MongoDB AccessLog
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: req.user._id,
      eventType: 'Admin Action',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'Medium',
      status: 'Success',
      riskScore: user.riskScore,
      details: `Admin created new employee account: ${user.fullName} (${user.email}) - Role: ${user.role}.`,
    });

    res.status(201).json(user);
  } catch (error) {
    logger.error(`createUser error: ${error.message}`);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

/**
 * Update a user's status (Active, Inactive, Blocked)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid user status value.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Protection rule: Prevent blocking administrator accounts
    if (user.role === 'admin' && status === 'blocked') {
      return res.status(403).json({ message: 'Protected Account: Administrator accounts cannot be blocked.' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log the admin action
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: req.user._id,
      eventType: 'Admin Action',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'High',
      status: 'Success',
      riskScore: user.riskScore,
      details: `Admin changed user ${user.fullName} status from ${oldStatus} to ${status}.`,
    });

    res.status(200).json(user);
  } catch (error) {
    logger.error(`updateUserStatus error: ${error.message}`);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

/**
 * Update user role (RBAC)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Protection rule: Admin role cannot be changed / demoted
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Protected Account: Administrator roles cannot be changed or demoted.' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: req.user._id,
      eventType: 'Admin Action',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'High',
      status: 'Success',
      riskScore: user.riskScore,
      details: `Admin changed user ${user.fullName} role from ${oldRole} to ${role}.`,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to change user role' });
  }
};

/**
 * Manually update risk score (Admin overrides / overrides simulation)
 */
const updateUserRiskScore = async (req, res) => {
  try {
    const { riskScore } = req.body;
    const scoreVal = parseInt(riskScore, 10);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      return res.status(400).json({ message: 'Risk score must be a number between 0 and 100.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.riskScore = scoreVal;
    // user pre-save hook handles updating riskLevel based on riskScore
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to adjust user risk score' });
  }
};

/**
 * Delete User
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Protection rule: Administrator accounts cannot be deleted
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Protected Account: Administrator accounts cannot be deleted.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User profile deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user profile' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  updateUserRiskScore,
  deleteUser,
};
