const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccessRequestSchema = new Schema(
  {
    requestId: { type: String, unique: true, index: true }, // REQ-2025-0018

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },

    accessType: {
      type: String,
      enum: ['Read Only', 'Read/Write', 'Full Access', 'Limited Access', 'Admin'],
      required: true,
    },
    reason: { type: String, required: true },

    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    riskScore: Number,

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Denied', 'Expired'],
      default: 'Pending',
      index: true,
    },

    requestedOn: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedOn: Date,
    reviewNotes: String,

    accessExpiresOn: Date, // when Approved, mirrors Resource "Access Expires On"
  },
  { timestamps: true }
);

AccessRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);