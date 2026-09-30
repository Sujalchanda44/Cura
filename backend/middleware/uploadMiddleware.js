/**
 * File Upload Middleware using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

// Memory Storage configuration (all image uploads are kept in memory and uploaded to cloud storage)
const memoryStorage = multer.memoryStorage();

// File filter (accept images only)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|heic|heif/;
  const isMimeValid = allowedTypes.test(file.mimetype) || file.mimetype?.startsWith('image/');
  const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid || isExtValid) {
    return cb(null, true);
  }
  cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, GIF, and HEIC images are allowed.'));
};

// Both uploadDisk and uploadMemory use in-memory buffers so local disk is NEVER used
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadDisk = uploadMemory; // Alias for backward compatibility without touching disk

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
