const User = require('../models/User');
const DocumentOtp = require('../models/DocumentOtp');
const generateToken = require('../utils/generateToken');
const mfaService = require('../services/mfaService');
const emailService = require('../services/emailService');
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
      // Record failed attempt atomically
      const attempts = (user.security?.failedLoginAttempts || 0) + 1;
      const isLocked = attempts >= 5;
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'security.failedLoginAttempts': attempts,
          ...(isLocked ? { status: 'blocked', 'security.lockedUntil': new Date(Date.now() + 30 * 60000) } : {}),
        },
      });

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

    // Session creation
    const sessionId = 'sess-' + Math.random().toString(36).substring(2, 10);
    const newSession = {
      sessionId,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      ip: deviceInfo.ip,
      location: `${locationInfo.city}, ${locationInfo.country}`,
      current: true,
    };

    // Atomic update to prevent VersionError race conditions during concurrent logins
    const matchedDevice = user.trustedDevices?.find(d => d.deviceId === deviceInfo.deviceId);

    const updateOps = {
      $set: {
        'security.failedLoginAttempts': 0,
        lastLogin: new Date(),
        lastLoginIp: deviceInfo.ip,
      },
      $push: {
        activeSessions: {
          $each: [newSession],
          $slice: -10, // keep latest 10 sessions max
        },
      },
    };

    if (!matchedDevice) {
      updateOps.$push.trustedDevices = {
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip: deviceInfo.ip,
        location: locationInfo.country,
        isTrusted: false,
      };
    } else {
      await User.updateOne(
        { _id: user._id, 'trustedDevices.deviceId': deviceInfo.deviceId },
        {
          $set: {
            'trustedDevices.$.lastUsedAt': new Date(),
            'trustedDevices.$.ip': deviceInfo.ip,
          },
        }
      );
    }

    await User.findByIdAndUpdate(user._id, updateOps);

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
      const otp = mfaService.generateNumericOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await DocumentOtp.deleteMany({ user: user._id, purpose: 'login_mfa', verified: false });

      const docOtp = new DocumentOtp({
        user: user._id,
        email: user.email,
        otp,
        expiresAt,
        purpose: 'login_mfa',
      });
      await docOtp.save();

      await emailService.sendMfaSecurityOtp({
        user,
        otp,
        title: 'Login Identity Verification',
        description: 'A sign-in request was detected. Enter this verification code to complete login.',
      });

      const targetEmail =
        (user.email.endsWith('@company.com') || user.email.endsWith('@example.com')) && process.env.EMAIL_USER
          ? process.env.EMAIL_USER
          : user.email;

      const maskEmail = (email) => {
        if (!email) return '';
        const [local, domain] = email.split('@');
        if (!domain) return email;
        const maskedLocal = local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : `${local[0]}*`;
        return `${maskedLocal}@${domain}`;
      };

      return res.status(200).json({
        mfaRequired: true,
        email: targetEmail,
        maskedEmail: maskEmail(targetEmail),
        tempToken: generateToken(user._id),
        hasTotp: !!user.security?.mfaSecret,
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
 * Verify MFA Token (Supports Google Authenticator TOTP, In-App OTP, Email OTP, and Test Bypass)
 */
const verifyMfa = async (req, res) => {
  try {
    const rawToken = req.body.token || req.body.code;
    const user = await User.findById(req.user._id).select('+security.mfaSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({ message: 'Please enter your 6-digit MFA verification code.' });
    }

    const cleanOtp = rawToken.trim();

    // 1. Check DocumentOtp (In-app / Email OTP)
    const otpRecord = await DocumentOtp.findOne({
      user: user._id,
      purpose: 'login_mfa',
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const isEmailOtpValid = otpRecord && otpRecord.otp === cleanOtp;

    // 2. Check RFC 6238 TOTP (Google Authenticator / Microsoft Authenticator)
    const isTotpValid = user.security?.mfaSecret && mfaService.verifyTotp(user.security.mfaSecret, cleanOtp);

    // 3. Testing bypass code
    const isBypassValid = cleanOtp === '123456';

    const isVerified = isEmailOtpValid || isTotpValid || isBypassValid;

    if (!isVerified) {
      if (otpRecord) {
        otpRecord.attempts += 1;
        await otpRecord.save();
      }
      return res.status(400).json({ message: 'Invalid verification code. Please check your Authenticator app or the on-screen passcode.' });
    }

    if (otpRecord) {
      otpRecord.verified = true;
      await otpRecord.save();
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
      details: `MFA login verification passed successfully (Method: ${isTotpValid ? 'TOTP Authenticator' : isEmailOtpValid ? 'Zero-Trust Passcode' : 'Test Bypass'})`,
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
 * Enable MFA Setup: Generates standard TOTP (Google Authenticator) secret + QR code + In-App OTP
 */
const setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Generate RFC 6238 TOTP Base32 secret and QR Code for Google/Microsoft Authenticator
    const totpData = mfaService.generateSecret(user.email);

    // 2. Also generate 6-digit In-App / Email OTP
    const otp = mfaService.generateNumericOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await DocumentOtp.deleteMany({ user: user._id, purpose: 'mfa_setup', verified: false });

    const docOtp = new DocumentOtp({
      user: user._id,
      email: user.email,
      otp,
      expiresAt,
      purpose: 'mfa_setup',
    });
    await docOtp.save();

    // Store pending TOTP secret in user's security profile
    await User.findByIdAndUpdate(user._id, {
      $set: { 'security.mfaSecret': totpData.secret },
    });

    // Attempt email dispatch (non-blocking)
    await emailService.sendMfaSecurityOtp({
      user,
      otp,
      title: 'MFA Security Setup',
      description: 'You initiated Multi-Factor Authentication enrollment for your account.',
    });

    const targetEmail =
      (user.email.endsWith('@company.com') || user.email.endsWith('@example.com')) && process.env.EMAIL_USER
        ? process.env.EMAIL_USER
        : user.email;

    const maskEmail = (email) => {
      if (!email) return '';
      const [local, domain] = email.split('@');
      if (!domain) return email;
      const maskedLocal = local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : `${local[0]}*`;
      return `${maskedLocal}@${domain}`;
    };

    res.status(200).json({
      success: true,
      message: 'MFA setup initialized. Scan the QR code with Google Authenticator or enter the Secret Key.',
      secret: totpData.secret,
      formattedSecret: totpData.formattedSecret,
      qrCodeUrl: totpData.qrCodeUrl,
      otpAuthUrl: totpData.otpAuthUrl,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
    });
  } catch (error) {
    logger.error(`setupMfa error: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate MFA setup details', error: error.message });
  }
};

/**
 * Confirm and Enable MFA with either Authenticator TOTP token, In-App OTP, or Bypass
 */
const confirmMfa = async (req, res) => {
  try {
    const rawToken = req.body.token || req.body.code;
    const user = await User.findById(req.user._id).select('+security.mfaSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({ message: 'Please enter the 6-digit verification code.' });
    }

    const cleanOtp = rawToken.trim();

    // 1. Check DocumentOtp
    const otpRecord = await DocumentOtp.findOne({
      user: user._id,
      purpose: 'mfa_setup',
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const isEmailOtpValid = otpRecord && otpRecord.otp === cleanOtp;

    // 2. Check TOTP from Google Authenticator
    const isTotpValid = user.security?.mfaSecret && mfaService.verifyTotp(user.security.mfaSecret, cleanOtp);

    // 3. Testing bypass code
    const isBypassValid = cleanOtp === '123456';

    const isVerified = isEmailOtpValid || isTotpValid || isBypassValid;

    if (!isVerified) {
      return res.status(400).json({ message: 'Verification failed. Invalid code. Check Google Authenticator or the on-screen passcode.' });
    }

    if (otpRecord) {
      otpRecord.verified = true;
      await otpRecord.save();
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { 'security.mfaEnabled': true },
    });

    res.status(200).json({
      mfaEnabled: true,
      message: 'Multi-Factor Authentication enabled successfully with Zero Trust protection.',
    });
  } catch (error) {
    logger.error(`confirmMfa error: ${error.message}`);
    res.status(500).json({ message: 'Failed to confirm MFA', error: error.message });
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
      const updateObj = {};
      if (emailNotifications !== undefined) updateObj['preferences.emailNotifications'] = emailNotifications;
      if (darkMode !== undefined) updateObj['preferences.darkMode'] = darkMode;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateObj },
        { new: true }
      );
      return res.status(200).json(updatedUser.preferences);
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

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'security.mfaEnabled': false,
        'security.mfaSecret': null,
      },
    });

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
