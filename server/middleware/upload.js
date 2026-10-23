const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpe?g|png|webp|bmp|gif|tiff|pdf)$/i;
  const isMimeAllowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  const isExtAllowed = allowedExtensions.test(file.originalname);

  if (isMimeAllowed || isExtAllowed) {
    return cb(null, true);
  } else {
    cb(new Error('Supported formats: Image notices (JPG, PNG, WEBP, BMP) or PDF documents!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max for high-res camera photos & scanned PDFs
  },
  fileFilter: fileFilter
});

module.exports = upload;
