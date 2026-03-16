import { Request, Response } from 'express';
import { routeMessage } from '../../services/messageRouter';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

export const handleIncomingMessage = async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const text = message.text?.body;

      if (text) {
        console.log(`Received message from ${from}: ${text}`);
        try {
          await routeMessage(from, text);
        } catch (err) {
          console.error('Error routing message:', err);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
};
