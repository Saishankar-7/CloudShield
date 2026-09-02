const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// --- Sub-schemas (embedded, always fetched with the user) ---

const TrustedDeviceSchema = new Schema(
  {
    deviceId: { type: String, required: true },
    deviceName: { type: String }, // e.g. "Chrome 124 on Windows"
    browser: String,
    os: String,
    ip: String,
    location: String,
    isTrusted: { type: Boolean, default: false },
    firstSeenAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    device: String,
    browser: String,
    ip: String,
    location: String,
    loginAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    employeeId: { type: String, unique: true, index: true }, // EMP-2025-0016
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    phone: String,
    avatarUrl: String,

    // --- RBAC ---
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee',
      index: true,
    },
    jobTitle: String,
    department: { type: String, index: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    workLocation: String,
    employeeType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Intern'],
      default: 'Full Time',
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
      index: true,
    },

    // --- Security / Zero Trust profile ---
    security: {
      mfaEnabled: { type: Boolean, default: false },
      mfaSecret: { type: String, select: false },
      recoveryEmail: String,
      backupCodes: [{ code: String, used: { type: Boolean, default: false } }],
      passwordChangedAt: Date,
      failedLoginAttempts: { type: Number, default: 0 },
      lockedUntil: Date,
    },

    trustedDevices: [TrustedDeviceSchema],
    activeSessions: [SessionSchema],

    // --- Risk engine snapshot (denormalized for fast dashboard reads) ---
    riskScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },

    preferences: {
      emailNotifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
    },

    lastLogin: Date,
    lastLoginIp: String,
    joinedOn: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// --- Hooks ---
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.security.passwordChangedAt = new Date();
  }
});

UserSchema.pre('save', function () {
  // keep riskLevel in sync with riskScore (mirrors calculateRisk.js output)
  const s = this.riskScore;
  this.riskLevel = s >= 81 ? 'Critical' : s >= 61 ? 'High' : s >= 31 ? 'Medium' : 'Low';
});

// --- Methods ---
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);