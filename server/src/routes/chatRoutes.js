import express from 'express';
import { handleChatMessage, handleSaveLead, handleHealth } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', handleChatMessage);
router.post('/lead', handleSaveLead);
router.get('/health', handleHealth);

export default router;

