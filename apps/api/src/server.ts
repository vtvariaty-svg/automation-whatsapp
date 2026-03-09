// WhatsApp Automation Server - Initial Structure
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import authRouter from './routes/auth';
import tenantRouter from './routes/tenant';
import productsRouter from './routes/products';
import aiRouter from './routes/ai';
import whatsappRouter from './routes/whatsapp';
import webhookRouter from './routes/webhook';

app.use('/auth', authRouter);
app.use('/tenant', tenantRouter);
app.use('/products', productsRouter);
app.use('/ai', aiRouter);
app.use('/whatsapp', whatsappRouter);
app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
