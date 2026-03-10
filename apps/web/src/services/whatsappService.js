import axios from "axios";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

/**
 * Envia mensagem de texto via WhatsApp Cloud API.
 * @param {string} to 
 * @param {string} text 
 */
export async function sendWhatsAppMessage(to, text, tenantPhoneId, tenantToken) {
  const phoneId = tenantPhoneId || WHATSAPP_PHONE_ID;
  const token = tenantToken || WHATSAPP_TOKEN;
  const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o WhatsApp:", error.response?.data || error.message);
    throw error;
  }
}
