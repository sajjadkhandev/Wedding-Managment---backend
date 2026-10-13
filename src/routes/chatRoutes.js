import express from 'express';
import { handleChatMessage, getQuickPrompts } from '../controllers/chatController.js';

const router = express.Router();

// Public chat endpoints for real-time concierge
router.post('/message', handleChatMessage);
router.get('/quick-prompts', getQuickPrompts);

export default router;
