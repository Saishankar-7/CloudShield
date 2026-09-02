const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original name and add timestamp
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter (documents, PDFs, spreadsheets, presentations, text, images)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|doc|docx|txt|xlsx|xls|csv|pptx|ppt|png|jpg|jpeg|json|xml|zip|md)$/i;
  const isExtAllowed = allowedExtensions.test(file.originalname);
  const mimetype = file.mimetype || '';
  const isMimeAllowed = /pdf|document|sheet|presentation|text|image|octet-stream|zip|msword/.test(mimetype);

  if (isExtAllowed || isMimeAllowed) {
    return cb(null, true);
  }
  cb(new Error('Only valid document files (PDF, Word, Excel, PowerPoint, Text, Image) are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max limit
  fileFilter,
});

module.exports = upload;
