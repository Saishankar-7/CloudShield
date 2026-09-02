const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccessLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource' }, // optional (e.g. login events have none)

    eventType: {
      type: String,
      enum: [
        'Login Success',
        'Failed Login',
        'Logout',
        'MFA Verification',
        'MFA OTP Sent',
        'MFA Document Verification',
        'Access Resource',
        'Access Denied',
        'Download File',
        'Upload File',
        'API Call',
        'Policy Changed',
        'Admin Action',
      ],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Authentication', 'Access', 'Authorization', 'Admin Actions', 'System'],
      required: true,
      index: true,
    },
    accessAction: {
      type: String,
      enum: ['Interactive', 'View', 'Query', 'Download', 'Upload', 'API Call', 'Admin', 'OTP Challenge'],
    },

    ipAddress: String,
    location: { country: String, city: String },
    device: String, // "Chrome 124 on Windows 11"
    browser: String,
    os: String,

    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
      index: true,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed', 'Blocked'],
      required: true,
      index: true,
    },
    riskScore: Number,

    details: String,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: false } } // logs are immutable, timestamp field is authoritative
);

AccessLogSchema.index({ user: 1, timestamp: -1 });
AccessLogSchema.index({ resource: 1, timestamp: -1 });

module.exports = mongoose.model('AccessLog', AccessLogSchema);