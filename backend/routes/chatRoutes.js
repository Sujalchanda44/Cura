/**
 * AI Chatbot Routes
 */

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Chat routes require authentication
router.use(authenticate);

router.post('/message', ChatController.sendMessage);
router.post('/', ChatController.sendMessage);

module.exports = router;
