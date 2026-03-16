import axios from 'axios';

const GRAPH = 'https://graph.facebook.com/v22.0';

export async function sendFacebookMessage(
  recipientId: string,
  text: string,
  pageId: string,
  pageToken: string,
): Promise<void> {
  await axios.post(
    `${GRAPH}/${pageId}/messages`,
    { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
    { headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' } },
  );
}
