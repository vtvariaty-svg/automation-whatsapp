import axios from 'axios';
import { withRetry } from '../../utils/retry';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export const sendMessage = async (phone: string, message: string) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('WHATSAPP_TOKEN or WHATSAPP_PHONE_ID is missing');
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`;

  try {
    const response = await withRetry(() => axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    ));
    return response.data;
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
};
