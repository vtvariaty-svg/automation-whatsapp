import axios from 'axios';

const API_URL = 'http://localhost:3000/api/webhook/whatsapp';
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';

async function sendWebhook(from: string, text: string) {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WH_ID',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '123456', phone_number_id: '123456' },
          contacts: [{ profile: { name: 'Tester' }, wa_id: from }],
          messages: [{
            from: from,
            id: `msg_${Date.now()}`,
            timestamp: Math.floor(Date.now() / 1000),
            text: { body: text },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };

  try {
    console.log(`Sending message from ${from}: "${text}"`);
    await axios.post(API_URL, payload);
  } catch (err: any) {
    console.error(`Error sending webhook: ${err.message}`);
  }
}

async function runTest() {
  console.log('Starting S2 E2E Validation...');
  
  // 1. Known Contact
  await sendWebhook('5521990886292', 'Oi, teste E2E contato conhecido');
  
  // 2. New Contact
  const newPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
  await sendWebhook(newPhone, 'Oi, teste E2E contato NOVO');
  
  // 3. Follow-up
  await sendWebhook(newPhone, 'Segunda mensagem do contato novo');
  
  console.log('E2E events sent. Check logs for shadow_validation_mismatch.');
}

runTest();
