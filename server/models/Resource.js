const mongoose = require('mongoose');
const { Schema } = mongoose;

const CloudStorageSchema = new Schema(
  {
    isCloudPdf: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ['Cloudinary Cloud', 'AWS S3', 'Google Cloud Storage', 'Azure Blob Storage', 'CloudFront / CDN', 'Direct Cloud URL', 'Custom Vault', 'None'],
      default: 'Cloudinary Cloud',
    },
    bucketName: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' }, // https URL or s3:// URI or data:application/pdf URL
    fileSize: { type: String, default: '' }, // e.g. "2.4 MB"
    fileType: { type: String, default: 'application/pdf' },
    encryption: { type: String, default: 'AES-256 Server-Side Encryption (KMS)' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // "Employee Data"
    identifier: { type: String, required: true }, // path/url e.g. "/employee-data" or "s3://company-docs"

    type: {
      type: String,
      enum: ['Application', 'Document', 'Database', 'Storage', 'API', 'System', 'Service', 'PDF Document'],
      required: true,
      index: true,
    },
    category: String, // Business, HR, Data, Analytics, Infrastructure, Development, Projects

    owner: { type: String, required: true }, // department or team name
    ownerUser: { type: Schema.Types.ObjectId, ref: 'User' },

    sensitivity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
      index: true,
    },

    status: {
      type: String,
      enum: ['Protected', 'Restricted', 'Public'],
      default: 'Protected',
      index: true,
    },

    accessPolicy: { type: Schema.Types.ObjectId, ref: 'Policy' },

    description: String,
    cloudStorage: { type: CloudStorageSchema, default: () => ({ isCloudPdf: false }) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ResourceSchema.index({ name: 'text', identifier: 'text' });

module.exports = mongoose.model('Resource', ResourceSchema);