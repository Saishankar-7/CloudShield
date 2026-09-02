const mongoose = require('mongoose');
const { Schema } = mongoose;

const DocumentOtpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    purpose: {
      type: String,
      default: 'document_access',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: automatically deletes document once expiresAt is reached
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DocumentOtp', DocumentOtpSchema);
