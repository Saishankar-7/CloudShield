const mongoose = require('mongoose');
const { Schema } = mongoose;

const SecurityAlertSchema = new Schema(
  {
    title: { type: String, required: true }, // "Unusual login from new device"
    description: String,

    type: {
      type: String,
      enum: [
        'unusual_login',
        'access_anomaly',
        'privilege_escalation',
        'data_access',
        'multiple_failed_logins',
        'policy_violation',
      ],
      required: true,
      index: true,
    },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource' },
    relatedLog: { type: Schema.Types.ObjectId, ref: 'AccessLog' },

    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      index: true,
    },
    riskScore: Number,

    status: {
      type: String,
      enum: ['Open', 'Investigating', 'Resolved', 'Dismissed'],
      default: 'Open',
      index: true,
    },

    ipAddress: String,
    location: String,

    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }, // admin investigating
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNotes: String,
  },
  { timestamps: true }
);

SecurityAlertSchema.index({ status: 1, riskLevel: 1 });

module.exports = mongoose.model('SecurityAlert', SecurityAlertSchema);