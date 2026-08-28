/**
 * Smart Scanner Routes
 */

const express = require('express');
const router = express.Router();
const ScannerController = require('../controllers/scannerController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadDisk, handleUpload } = require('../middleware/uploadMiddleware');

// All scanner endpoints require authentication
router.use(authenticate);

// Handle image upload, base64 payload, or barcode
router.post('/analyze', handleUpload(uploadDisk.single('image')), ScannerController.analyze);

module.exports = router;
