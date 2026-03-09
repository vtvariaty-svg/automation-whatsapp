import { Router } from 'express';
import { verifyWebhook, handleIncomingMessage } from '../integrations/whatsapp/whatsappWebhook';

const router = Router();

// Endpoint específico conforme solicitado pela Meta Cloud API do usuário
router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', handleIncomingMessage);

export default router;
