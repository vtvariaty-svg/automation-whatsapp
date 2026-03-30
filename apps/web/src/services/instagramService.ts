import axios from 'axios';

const GRAPH = 'https://graph.facebook.com/v22.0';

function mask(id: string) {
  return id?.length > 4 ? `****${id.slice(-4)}` : '****';
}

export async function sendInstagramMessage(
  recipientId: string,
  text: string,
  igAccountId: string,
  pageToken: string,
): Promise<void> {
  console.log(`[IG_SEND] attempt igAccountId=${mask(igAccountId)} recipientId=${mask(recipientId)}`);
  try {
    const res = await axios.post(
      `${GRAPH}/${igAccountId}/messages`,
      { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
      { headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' } },
    );
    console.log(
      `[IG_SEND] success igAccountId=${mask(igAccountId)} recipientId=${mask(recipientId)} status=${res.status}`,
    );
  } catch (e: any) {
    const status = e?.response?.status;
    const meta = e?.response?.data?.error;
    console.error(
      `[IG_SEND] failed igAccountId=${mask(igAccountId)} recipientId=${mask(recipientId)} httpStatus=${status} errCode=${meta?.code} errSubCode=${meta?.error_subcode} errMsg=${meta?.message}`,
    );
    throw e;
  }
}

export async function replyToInstagramComment(
  commentId: string,
  text: string,
  pageToken: string,
): Promise<void> {
  await axios.post(
    `${GRAPH}/${commentId}/replies`,
    { message: text },
    { headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' } },
  );
}

export async function hideInstagramComment(
  commentId: string,
  hide: boolean,
  pageToken: string,
): Promise<void> {
  await axios.post(
    `${GRAPH}/${commentId}`,
    { is_hidden: hide },
    { headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' } },
  );
}
