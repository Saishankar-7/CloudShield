const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const mfaService = require('../services/mfaService');
const loggingService = require('../services/loggingService');
const logger = require('../utils/logger');

// Generate realistic employee ID
const generateEmployeeId = async () => {
  const count = await User.countDocuments();
  return `EMP-2026-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Register a new employee
 */
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, department, jobTitle, phone, employeeType, workLocation } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const employeeId = await generateEmployeeId();

    const user = new User({
      employeeId,
      fullName,
      email,
      password, // hashed inside mongoose pre-save hook
      department: department || 'Engineering',
      jobTitle: jobTitle || 'Software Engineer',
      phone,
      employeeType: employeeType || 'Full Time',
      workLocation: workLocation || 'India',
      riskScore: 10, // default low score
    });

    // Device detection simulation
    const userAgentStr = req.headers['user-agent'] || 'Chrome on Windows 11';
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    const location = req.headers['x-location-country'] || 'India';
    
    // Add default device
    user.trustedDevices.push({
      deviceId: 'device-' + Math.random().toString(36).substring(2, 10),
      deviceName: userAgentStr,
      browser: 'Chrome',
      os: 'Windows',
      ip,
      location,
      isTrusted: true, // auto-trust first device
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error(`Register user error: ${error.message}`);
    res.status(500).json({ message: 'Server Error during registration', error: error.message });
  }
};

/**
 * Authenticate user & get token (Login)
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'This account has been blocked' });
    }

    // Capture context
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || 'device-login-key',
      deviceName: req.headers['x-device-name'] || req.headers['user-agent'] || 'Chrome on Windows 11',
      browser: req.headers['x-device-browser'] || 'Chrome',
      os: req.headers['x-device-os'] || 'Windows',
      ip: req.headers['x-simulated-ip'] || req.ip || '192.168.1.10',
    };
    const locationInfo = {
      country: req.headers['x-location-country'] || 'India',
      city: req.headers['x-location-city'] || 'Mumbai',
    };

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed attempt
      user.security.failedLoginAttempts += 1;
      if (user.security.failedLoginAttempts >= 5) {
        user.status = 'blocked';
        user.security.lockedUntil = new Date(Date.now() + 30 * 60000); // lock 30 mins
      }
      await user.save();

      // Log failure
      await loggingService.logEvent({
        user: user._id,
        eventType: 'Failed Login',
        category: 'Authentication',
        ipAddress: deviceInfo.ip,
        location: locationInfo,
        device: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        severity: 'High',
        status: 'Failed',
        riskScore: 70, // static high risk for failed login
        details: `Failed password login attempt. User locked status: ${user.status === 'blocked'}`,
      });

      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Reset failed attempts on success
    user.security.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    user.lastLoginIp = deviceInfo.ip;

    // Check device trust
    const matchedDevice = user.trustedDevices.find(d => d.deviceId === deviceInfo.deviceId);
    if (!matchedDevice) {
      user.trustedDevices.push({
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip: deviceInfo.ip,
        location: locationInfo.country,
        isTrusted: false, // requires admin review or first time MFA to trust
      });
    } else {
      matchedDevice.lastUsedAt = new Date();
      matchedDevice.ip = deviceInfo.ip;
    }

    // Add session
    const sessionId = 'sess-' + Math.random().toString(36).substring(2, 10);
    user.activeSessions.push({
      sessionId,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      ip: deviceInfo.ip,
      location: `${locationInfo.city}, ${locationInfo.country}`,
      current: true,
    });

    await user.save();

    // Log success
    await loggingService.logEvent({
      user: user._id,
      eventType: 'Login Success',
      category: 'Authentication',
      ipAddress: deviceInfo.ip,
      location: locationInfo,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      severity: 'Low',
      status: 'Success',
      riskScore: user.riskScore,
      details: 'User authenticated successfully',
    });

    // Check if user requires MFA
    if (user.security.mfaEnabled) {
      return res.status(200).json({
        mfaRequired: true,
        email: user.email,
        tempToken: generateToken(user._id),
      });
    }

    res.status(200).json({
      _id: user._id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      riskScore: user.riskScore,
      riskLevel: user.riskLevel,
      security: {
        mfaEnabled: user.security.mfaEnabled,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server Error during login', error: error.message });
  }
};

/**
 * Verify MFA Token
 */
const verifyMfa = async (req, res) => {
  try {
    const { token } = req.body;
    // user already set on req by protect middleware
    const user = await User.findById(req.user._id).select('+security.mfaSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify token
    const isVerified = mfaService.verifyToken(user.security.mfaSecret, token);
    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid multi-factor authentication code.' });
    }

    // Log MFA success
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: user._id,
      eventType: 'MFA Verification',
      category: 'Authentication',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'Low',
      status: 'Success',
      riskScore: user.riskScore,
      details: 'MFA challenge verification passed successfully',
    });

    res.status(200).json({
      _id: user._id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      riskScore: user.riskScore,
      riskLevel: user.riskLevel,
      security: {
        mfaEnabled: user.security.mfaEnabled,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error(`MFA verification error: ${error.message}`);
    res.status(500).json({ message: 'MFA verification failed', error: error.message });
  }
};

/**
 * Get profile data of current user
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile' });
  }
};

/**
 * Enable MFA Setup (Generates QR Code URL & Secret)
 */
const setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { secret, qrCodeUrl } = mfaService.generateSecret(user.email);
    user.security.mfaSecret = secret;
    await user.save();

    res.status(200).json({
      secret,
      qrCodeUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate MFA setup details' });
  }
};

/**
 * Confirm and Enable MFA
 */
const confirmMfa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+security.mfaSecret');

    if (!user || !user.security.mfaSecret) {
      return res.status(400).json({ message: 'MFA setup not initialized.' });
    }

    const isVerified = mfaService.verifyToken(user.security.mfaSecret, token);
    if (!isVerified) {
      return res.status(400).json({ message: 'Verification failed. Invalid code.' });
    }

    user.security.mfaEnabled = true;
    await user.save();

    res.status(200).json({
      mfaEnabled: true,
      message: 'Multi-Factor Authentication enabled successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm MFA' });
  }
};

/**
 * Update Preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const { emailNotifications, darkMode } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
      if (darkMode !== undefined) user.preferences.darkMode = darkMode;
      await user.save();
      return res.status(200).json(user.preferences);
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

/**
 * Disable Multi-Factor Authentication
 */
const disableMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.security.mfaEnabled = false;
    user.security.mfaSecret = null;
    await user.save();

    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: user._id,
      eventType: 'Policy Changed',
      category: 'Authentication',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'Medium',
      status: 'Success',
      riskScore: user.riskScore,
      details: 'MFA was disabled by the user.',
    });

    res.status(200).json({
      mfaEnabled: false,
      message: 'Multi-Factor Authentication disabled successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable MFA' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyMfa,
  getUserProfile,
  setupMfa,
  confirmMfa,
  updatePreferences,
  disableMfa,
};
