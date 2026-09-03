const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Policy = require('./models/Policy');
const AccessRequest = require('./models/AccessRequest');
const AccessLog = require('./models/AccessLog');
const SecurityAlert = require('./models/SecurityAlert');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const seedDatabase = async (exitOnComplete = true) => {
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    logger.info('Clearing database collections...');
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Policy.deleteMany({});
    await AccessRequest.deleteMany({});
    await AccessLog.deleteMany({});
    await SecurityAlert.deleteMany({});

    logger.info('Creating security policies...');

    // 1. Policy for low sensitivity documents
    const generalPolicy = new Policy({
      name: 'General_Employee_Access_Policy',
      description: 'Allows basic read access to general company documents for all employees.',
      appliesTo: {
        roles: ['employee', 'manager', 'admin'],
        departments: [] // applies to all
      },
      resourceTypes: ['Document', 'Application', 'Service'],
      defaultAccessLevel: 'Read Only',
      conditions: {
        maxAllowedRiskScore: 60,
        mfaRequiredAboveRiskScore: 30,
        allowedLocations: [],
        blockUnrecognizedDevices: false,
        officeHoursOnly: false
      },
      riskWeights: {
        unrecognizedDevice: 30,
        newLocation: 25,
        outsideAccessWindow: 15,
        highSensitivityResource: 10,
        recentFailedLogins: 5
      }
    });
    await generalPolicy.save();

    // 2. Policy for reports and analytics
    const analyticsPolicy = new Policy({
      name: 'Reports_Analytics_Policy',
      description: 'Allows viewing performance analytics for employees and managers.',
      appliesTo: {
        roles: ['employee', 'manager', 'admin'],
        departments: ['Engineering', 'Marketing', 'Sales', 'Product']
      },
      resourceTypes: ['Application', 'API', 'Service'],
      defaultAccessLevel: 'Read/Write',
      conditions: {
        maxAllowedRiskScore: 60,
        mfaRequiredAboveRiskScore: 25,
        allowedLocations: ['India', 'United States'],
        blockUnrecognizedDevices: false,
        officeHoursOnly: false
      }
    });
    await analyticsPolicy.save();

    // 3. Policy for High-sensitivity HR data
    const hrPolicy = new Policy({
      name: 'Sensitive_HR_Data_Policy',
      description: 'Policy governing access to employee directory and records database.',
      appliesTo: {
        roles: ['manager', 'admin'],
        departments: ['HR', 'Engineering', 'IT Security'] // Engineering has limited view
      },
      resourceTypes: ['Database', 'Document'],
      defaultAccessLevel: 'Limited Access',
      conditions: {
        maxAllowedRiskScore: 50,
        mfaRequiredAboveRiskScore: 15, // MFA required for almost any request
        allowedLocations: ['India'],
        blockUnrecognizedDevices: true, // block unauthorized devices
        officeHoursOnly: true,
        officeHoursStart: '08:00',
        officeHoursEnd: '20:00'
      }
    });
    await hrPolicy.save();

    // 4. Policy for Critical Systems (Admin Panel)
    const adminPolicy = new Policy({
      name: 'Critical_Infrastructure_Policy',
      description: 'Strict security controls for Company Administrative systems.',
      appliesTo: {
        roles: ['admin'],
        departments: ['IT Security']
      },
      resourceTypes: ['System', 'Database', 'API'],
      defaultAccessLevel: 'Admin',
      conditions: {
        maxAllowedRiskScore: 40,
        mfaRequiredAboveRiskScore: 10,
        allowedLocations: ['India'],
        blockUnrecognizedDevices: true,
        officeHoursOnly: false
      }
    });
    await adminPolicy.save();

    logger.info('Creating system resources...');

    const resDocuments = new Resource({
      name: 'Documents',
      identifier: '/api/resources/docs',
      type: 'Document',
      category: 'Business',
      owner: 'Business Operations',
      sensitivity: 'Low',
      status: 'Protected',
      accessPolicy: generalPolicy._id,
      description: 'Company policies, forms and employee guidelines.'
    });
    await resDocuments.save();

    const resReports = new Resource({
      name: 'Reports',
      identifier: '/api/resources/reports',
      type: 'Service',
      category: 'Analytics',
      owner: 'Product Engineering',
      sensitivity: 'Medium',
      status: 'Protected',
      accessPolicy: analyticsPolicy._id,
      description: 'View your performance, project reports and sprint metrics.'
    });
    await resReports.save();

    const resEmployeeData = new Resource({
      name: 'Employee Data',
      identifier: '/api/resources/employees',
      type: 'Database',
      category: 'HR',
      owner: 'Human Resources',
      sensitivity: 'High',
      status: 'Protected',
      accessPolicy: hrPolicy._id,
      description: 'Team directory, employee files, salary logs and contact information.',
      cloudStorage: {
        isCloudPdf: true,
        provider: 'Cloudinary Cloud',
        bucketName: 'dlxueeeau / hr-vault',
        fileName: 'Enterprise_HR_Employee_Directory_2025.pdf',
        fileUrl: 'https://res.cloudinary.com/dlxueeeau/raw/upload/v1788411013/cloudshield_hr/Enterprise_HR_Employee_Directory_2025.pdf',
        fileSize: '1.8 MB',
        fileType: 'application/pdf',
        encryption: 'AES-256 Cloudinary Server-Side Encryption',
        uploadedAt: new Date(),
      },
    });
    await resEmployeeData.save();

    const resAnalytics = new Resource({
      name: 'Dashboard Analytics',
      identifier: '/api/resources/analytics',
      type: 'Application',
      category: 'Analytics',
      owner: 'Business Development',
      sensitivity: 'Medium',
      status: 'Protected',
      accessPolicy: generalPolicy._id,
      description: 'View your team and business performance statistics.'
    });
    await resAnalytics.save();

    const resAdminPanel = new Resource({
      name: 'Admin Panel',
      identifier: '/api/resources/admin-panel',
      type: 'System',
      category: 'Infrastructure',
      owner: 'IT Security Office',
      sensitivity: 'Critical',
      status: 'Restricted',
      accessPolicy: adminPolicy._id,
      description: 'Administrative terminal managing servers, firewalls, and network configurations.'
    });
    await resAdminPanel.save();

    logger.info('Creating demo users...');

    // 1. Employee: Sai Kumar
    const employeeUser = new User({
      employeeId: 'EMP-2025-0016',
      fullName: 'Sai Kumar',
      email: 'sai@company.com',
      password: 'password123', // hashed in User schema hook
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120&h=120',
      role: 'employee',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      workLocation: 'India',
      riskScore: 15,
      riskLevel: 'Low',
      lastLogin: new Date(),
      lastLoginIp: '192.168.1.10',
      security: {
        mfaEnabled: false, // let user toggle this in frontend
        mfaSecret: 'CLOUDSHIELD_SAI_MOCK_SECRET_KEY_123',
        recoveryEmail: 'sai.backup@gmail.com'
      }
    });

    // Add trusted device
    employeeUser.trustedDevices.push({
      deviceId: 'device-trusted-sai-win',
      deviceName: 'Chrome 124 on Windows 11',
      browser: 'Chrome',
      os: 'Windows',
      ip: '192.168.1.10',
      location: 'India',
      isTrusted: true
    });

    // Add active session
    employeeUser.activeSessions.push({
      sessionId: 'sess-active-sai-1',
      device: 'Chrome 124 on Windows 11',
      browser: 'Chrome',
      ip: '192.168.1.10',
      location: 'Mumbai, India',
      current: true
    });

    await employeeUser.save();

    // 2. Administrator
    const adminUser = new User({
      employeeId: 'EMP-2025-0001',
      fullName: 'Admin',
      email: 'admin@company.com',
      password: 'password123',
      phone: '+91 99999 88888',
      role: 'admin',
      jobTitle: 'Super Admin',
      department: 'IT Security',
      workLocation: 'India',
      riskScore: 5,
      riskLevel: 'Low',
      lastLogin: new Date(),
      lastLoginIp: '192.168.1.1',
      security: {
        mfaEnabled: false,
        mfaSecret: 'CLOUDSHIELD_ADMIN_MOCK_SECRET_KEY_999',
        recoveryEmail: 'admin.backup@company.com'
      }
    });

    adminUser.trustedDevices.push({
      deviceId: 'device-trusted-admin-win',
      deviceName: 'Edge 124 on Windows Server',
      browser: 'Edge',
      os: 'Windows',
      ip: '192.168.1.1',
      location: 'India',
      isTrusted: true
    });

    adminUser.activeSessions.push({
      sessionId: 'sess-active-admin-1',
      device: 'Edge 124 on Windows Server',
      browser: 'Edge',
      ip: '192.168.1.1',
      location: 'Mumbai, India',
      current: true
    });

    await adminUser.save();

    // 3. Other employees to match dashboard user count (e.g. Ravi Teja, John Doe, Priya Sharma, Mike Johnson)
    const raviTeja = new User({
      employeeId: 'EMP-2025-0045',
      fullName: 'Ravi Teja',
      email: 'ravi@company.com',
      password: 'password123',
      role: 'employee',
      jobTitle: 'Cloud Architect',
      department: 'Product Infrastructure',
      workLocation: 'India',
      riskScore: 85, // High risk
      riskLevel: 'High',
      lastLogin: new Date(),
      lastLoginIp: '203.16.78.10'
    });
    raviTeja.trustedDevices.push({
      deviceId: 'device-ravi-unrecognized',
      deviceName: 'Opera on Linux',
      browser: 'Opera',
      os: 'Linux',
      ip: '203.16.78.10',
      location: 'Unknown Location',
      isTrusted: false
    });
    await raviTeja.save();

    const johnDoe = new User({
      employeeId: 'EMP-2025-0012',
      fullName: 'John Doe',
      email: 'john@company.com',
      password: 'password123',
      role: 'employee',
      jobTitle: 'QA Lead',
      department: 'Engineering',
      workLocation: 'India',
      riskScore: 25,
      riskLevel: 'Low',
      lastLogin: new Date(),
      lastLoginIp: '192.168.1.12'
    });
    await johnDoe.save();

    const priyaSharma = new User({
      employeeId: 'EMP-2025-0019',
      fullName: 'Priya Sharma',
      email: 'priya@company.com',
      password: 'password123',
      role: 'employee',
      jobTitle: 'HR Specialist',
      department: 'Human Resources',
      workLocation: 'India',
      riskScore: 65,
      riskLevel: 'High',
      lastLogin: new Date(),
      lastLoginIp: '103.22.45.16'
    });
    await priyaSharma.save();

    const mikeJohnson = new User({
      employeeId: 'EMP-2025-0033',
      fullName: 'Mike Johnson',
      email: 'mike@company.com',
      password: 'password123',
      role: 'manager',
      jobTitle: 'Product Manager',
      department: 'Product Development',
      workLocation: 'United States',
      riskScore: 45,
      riskLevel: 'Medium',
      lastLogin: new Date(),
      lastLoginIp: '78.45.12.99'
    });
    await mikeJohnson.save();

    logger.info('Creating historical audit logs...');

    // Access Logs representing recent activities
    const logs = [
      {
        user: employeeUser._id,
        resource: resReports._id,
        eventType: 'Access Resource',
        category: 'Access',
        accessAction: 'View',
        ipAddress: '192.168.1.10',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Chrome 124 on Windows 11',
        browser: 'Chrome',
        os: 'Windows',
        severity: 'Low',
        status: 'Success',
        riskScore: 10,
        details: 'Viewed Reports - Policy general allowed.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        user: employeeUser._id,
        resource: resDocuments._id,
        eventType: 'Download File',
        category: 'Access',
        accessAction: 'Download',
        ipAddress: '192.168.1.10',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Chrome 124 on Windows 11',
        browser: 'Chrome',
        os: 'Windows',
        severity: 'Low',
        status: 'Success',
        riskScore: 10,
        details: 'Downloaded Document: Company guidelines.',
        timestamp: new Date(Date.now() - 80 * 60 * 1000) // 1hr 20m ago
      },
      {
        user: employeeUser._id,
        resource: resAnalytics._id,
        eventType: 'Access Resource',
        category: 'Access',
        accessAction: 'View',
        ipAddress: '192.168.1.10',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Chrome 124 on Windows 11',
        browser: 'Chrome',
        os: 'Windows',
        severity: 'Low',
        status: 'Success',
        riskScore: 15,
        details: 'Accessed Dashboard Analytics',
        timestamp: new Date(Date.now() - 105 * 60 * 1000) // 1hr 45m ago
      },
      {
        user: employeeUser._id,
        resource: resEmployeeData._id,
        eventType: 'Access Denied',
        category: 'Authorization',
        accessAction: 'View',
        ipAddress: '192.168.1.10',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Chrome 124 on Windows 11',
        browser: 'Chrome',
        os: 'Windows',
        severity: 'Medium',
        status: 'Blocked',
        riskScore: 45,
        details: 'Access Denied. Sensitive_HR_Data_Policy triggered MFA Verification requirement, but interactive validation failed.',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) // Yesterday
      },
      {
        user: employeeUser._id,
        resource: resAdminPanel._id,
        eventType: 'Access Denied',
        category: 'Authorization',
        accessAction: 'View',
        ipAddress: '192.168.1.10',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Chrome 124 on Windows 11',
        browser: 'Chrome',
        os: 'Windows',
        severity: 'High',
        status: 'Blocked',
        riskScore: 85,
        details: 'Access Denied. Critical_Infrastructure_Policy restricts access to Super Admins only.',
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000) // Yesterday
      },
      // Admin dashboard matching logs
      {
        user: raviTeja._id,
        resource: resAdminPanel._id,
        eventType: 'Access Denied',
        category: 'Authorization',
        accessAction: 'View',
        ipAddress: '203.16.78.10',
        location: { country: 'Unknown', city: 'Unknown' },
        device: 'Opera on Linux',
        browser: 'Opera',
        os: 'Linux',
        severity: 'High',
        status: 'Blocked',
        riskScore: 85,
        details: 'Unrecognized Device Blocked. User is an Employee trying to access restricted admin terminal.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10m ago
      },
      {
        user: johnDoe._id,
        resource: resDocuments._id,
        eventType: 'Access Resource',
        category: 'Access',
        accessAction: 'View',
        ipAddress: '192.168.1.12',
        location: { country: 'India', city: 'Mumbai' },
        device: 'Firefox on Windows',
        browser: 'Firefox',
        os: 'Windows',
        severity: 'Low',
        status: 'Success',
        riskScore: 25,
        details: 'Accessed General Documents',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ];

    for (const logData of logs) {
      const log = new AccessLog(logData);
      await log.save();
    }

    logger.info('Creating security alerts...');

    // Security alerts
    const alerts = [
      {
        title: 'Unrecognized device access blocked',
        description: `Employee Ravi Teja attempted to access Admin Panel from Linux computer with IP 203.16.78.10 outside standard location list.`,
        type: 'access_anomaly',
        user: raviTeja._id,
        resource: resAdminPanel._id,
        riskLevel: 'High',
        riskScore: 85,
        ipAddress: '203.16.78.10',
        location: 'Unknown Location',
        status: 'Open'
      },
      {
        title: 'Policy violation: Unprivileged access request',
        description: `User Sai Kumar attempted to access critical infrastructure without administrative permissions.`,
        type: 'policy_violation',
        user: employeeUser._id,
        resource: resAdminPanel._id,
        riskLevel: 'High',
        riskScore: 75,
        ipAddress: '192.168.1.10',
        location: 'Mumbai, India',
        status: 'Open'
      },
      {
        title: 'Multiple failed login attempts',
        description: 'Account security lock triggered due to 5 consecutive failed authentication requests.',
        type: 'multiple_failed_logins',
        user: priyaSharma._id,
        riskLevel: 'Medium',
        riskScore: 65,
        ipAddress: '103.22.45.16',
        location: 'New Delhi, India',
        status: 'Resolved',
        resolvedBy: adminUser._id,
        resolvedAt: new Date(),
        resolutionNotes: 'User password reset completed and MFA challenge verified via administrator voice verification.'
      }
    ];

    for (const alertData of alerts) {
      const alert = new SecurityAlert(alertData);
      await alert.save();
    }

    logger.info('Creating access requests...');

    // Access Requests matching the Admin screenshot
    const requests = [
      {
        requestId: 'REQ-2026-0001',
        user: employeeUser._id,
        resource: resReports._id,
        accessType: 'Read Only',
        reason: 'Analyzing monthly product sprint updates and resource allocations.',
        riskLevel: 'Low',
        riskScore: 10,
        status: 'Approved',
        requestedOn: new Date(Date.now() - 3 * 3600000), // 3 hours ago
        reviewedBy: adminUser._id,
        reviewedOn: new Date(Date.now() - 2.5 * 3600000),
        reviewNotes: 'Standard business analysis permission approved.',
        accessExpiresOn: new Date(Date.now() + 24 * 3600000)
      },
      {
        requestId: 'REQ-2026-0002',
        user: raviTeja._id,
        resource: resAdminPanel._id,
        accessType: 'Admin',
        reason: 'Urgent hotfix implementation on DB server configs.',
        riskLevel: 'High',
        riskScore: 85,
        status: 'Denied',
        requestedOn: new Date(Date.now() - 2 * 3600000),
        reviewedBy: adminUser._id,
        reviewedOn: new Date(Date.now() - 1.8 * 3600000),
        reviewNotes: 'Access Denied. Devops roles do not permit administrative override logs on critical systems.'
      },
      {
        requestId: 'REQ-2026-0003',
        user: johnDoe._id,
        resource: resDocuments._id,
        accessType: 'Read Only',
        reason: 'Accessing new employee policy document checklist.',
        riskLevel: 'Low',
        riskScore: 25,
        status: 'Approved',
        requestedOn: new Date(Date.now() - 1.5 * 3600000),
        reviewedBy: adminUser._id,
        reviewedOn: new Date(Date.now() - 1.4 * 3600000),
        reviewNotes: 'Granted, basic compliance documentation.',
        accessExpiresOn: new Date(Date.now() + 7 * 24 * 3600000)
      },
      {
        requestId: 'REQ-2026-0004',
        user: priyaSharma._id,
        resource: resEmployeeData._id,
        accessType: 'Read/Write',
        reason: 'Updating team salary logs and HR metadata records.',
        riskLevel: 'High',
        riskScore: 65,
        status: 'Pending',
        requestedOn: new Date(Date.now() - 0.5 * 3600000) // 30m ago
      },
      {
        requestId: 'REQ-2026-0005',
        user: mikeJohnson._id,
        resource: resReports._id,
        accessType: 'Read Only',
        reason: 'Review PM analytics performance dashboard metrics.',
        riskLevel: 'Low',
        riskScore: 15,
        status: 'Approved',
        requestedOn: new Date(Date.now() - 0.2 * 3600000),
        reviewedBy: adminUser._id,
        reviewedOn: new Date(Date.now() - 0.1 * 3600000),
        accessExpiresOn: new Date(Date.now() + 48 * 3600000)
      }
    ];

    for (const reqData of requests) {
      const accessReq = new AccessRequest(reqData);
      await accessReq.save();
    }

    logger.info('Database seeded successfully with all demo users, resources, and policies!');
    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
