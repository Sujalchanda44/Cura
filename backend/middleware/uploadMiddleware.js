/**
 * File Upload Middleware using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

// Ensure upload directory exists
const uploadPath = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Disk Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Memory Storage (useful for direct buffer processing with AI)
const memoryStorage = multer.memoryStorage();

// File filter (accept images only)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const isMimeValid = allowedTypes.test(file.mimetype);
  const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }
  cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
};

const uploadDisk = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: imageFilter
});

// Wrapper to handle Multer errors gracefully
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ResponseHandler.error(
            res,
            `File exceeds maximum limit of ${config.upload.maxFileSizeMb}MB.`,
            HTTP_STATUS.BAD_REQUEST
          );
        }
        return ResponseHandler.error(res, err.message, HTTP_STATUS.BAD_REQUEST);
      } else if (err) {
        return ResponseHandler.error(res, err.message, HTTP_STATUS.BAD_REQUEST);
      }
      next();
    });
  };
};

module.exports = {
  uploadDisk,
  uploadMemory,
  handleUpload
};
