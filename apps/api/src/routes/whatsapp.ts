import { Router } from 'express';
import { verifyWebhook, handleIncomingMessage } from '../integrations/whatsapp/whatsappWebhook';

const router = Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingMessage);

export default router;
