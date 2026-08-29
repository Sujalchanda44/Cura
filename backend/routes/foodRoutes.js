/**
 * Food Scanner & Nutrition Routes
 */

const express = require('express');
const router = express.Router();
const FoodController = require('../controllers/foodController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadDisk, handleUpload } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validateMiddleware');

// Validation Schemas
const barcodeSchema = {
  barcode: { required: true }
};

const nutritionAnalysisSchema = {
  mealDescription: { required: true, minLength: 2 }
};

// All food routes require authentication
router.use(authenticate);

router.post('/upload-image', handleUpload(uploadDisk.single('foodImage')), FoodController.uploadFoodImage);
router.post('/scan-barcode', validate(barcodeSchema), FoodController.scanBarcode);
router.get('/product/:barcode', FoodController.getProductDetails);
router.post('/check-allergens', FoodController.checkAllergens);
router.post('/nutrition-analysis', validate(nutritionAnalysisSchema), FoodController.analyzeNutrition);
router.post('/ai-recommendation', FoodController.getAIRecommendation);

module.exports = router;
