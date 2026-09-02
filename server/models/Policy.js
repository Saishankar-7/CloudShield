const mongoose = require('mongoose');
const { Schema } = mongoose;

const PolicySchema = new Schema(
  {
    name: { type: String, required: true }, // "HR_Manager_Policy"
    description: String,

    appliesTo: {
      roles: [{ type: String, enum: ['employee', 'manager', 'admin'] }],
      departments: [String],
    },

    resourceTypes: [
      { type: String, enum: ['Application', 'Document', 'Database', 'Storage', 'API', 'System', 'Service'] },
    ],

    defaultAccessLevel: {
      type: String,
      enum: ['Read Only', 'Read/Write', 'Full Access', 'Limited Access', 'Admin', 'None'],
      default: 'Read Only',
    },

    // --- Zero Trust conditions evaluated by the risk/policy engine ---
    conditions: {
      maxAllowedRiskScore: { type: Number, default: 60 }, // above this => deny
      mfaRequiredAboveRiskScore: { type: Number, default: 30 }, // between this and max => require MFA
      allowedLocations: [String], // empty = any
      blockUnrecognizedDevices: { type: Boolean, default: false },
      officeHoursOnly: { type: Boolean, default: false },
      officeHoursStart: { type: String, default: '09:00' },
      officeHoursEnd: { type: String, default: '18:00' },
    },

    // Weights used by calculateRisk.js to score a request against this policy
    riskWeights: {
      unrecognizedDevice: { type: Number, default: 30 },
      newLocation: { type: Number, default: 25 },
      outsideAccessWindow: { type: Number, default: 15 },
      highSensitivityResource: { type: Number, default: 10 },
      recentFailedLogins: { type: Number, default: 5 },
    },

    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Policy', PolicySchema);