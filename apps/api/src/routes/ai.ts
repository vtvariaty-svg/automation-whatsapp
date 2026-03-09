import { Router } from 'express';
import { generateResponse, classifyIntent } from '../services/aiService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/test', async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await generateResponse(tenantId, message);
    const intent = await classifyIntent(message);

    res.json({ 
      response,
      intent
    });
  } catch (error: any) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
