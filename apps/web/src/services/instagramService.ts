import axios from 'axios';

// Instagram Login architecture.
// All Instagram messaging and comment operations use graph.instagram.com.
// Auth is performed with the IG user access token (not a Facebook page access token).

const IG_GRAPH = 'https://graph.instagram.com/v22.0';

function mask(id: string) {
  return id?.length > 4 ? `****${id.slice(-4)}` : '****';
}

export async function sendInstagramMessage(
  recipientId: string,
  text: string,
  igUserId: string,
  igToken: string,
): Promise<void> {
  console.log(`[IG_SEND] attempt igUserId=${mask(igUserId)} recipientId=${mask(recipientId)}`);
  try {
    const res = await axios.post(
      `${IG_GRAPH}/${igUserId}/messages`,
      { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
      { headers: { Authorization: `Bearer ${igToken}`, 'Content-Type': 'application/json' } },
    );
    console.log(
      `[IG_SEND] success igUserId=${mask(igUserId)} recipientId=${mask(recipientId)} status=${res.status}`,
    );
  } catch (e: any) {
    const status = e?.response?.status;
    const meta = e?.response?.data?.error;
    console.error(
      `[IG_SEND] failed igUserId=${mask(igUserId)} recipientId=${mask(recipientId)} httpStatus=${status} errCode=${meta?.code} errSubCode=${meta?.error_subcode} errMsg=${meta?.message}`,
    );
    throw e;
  }
}

export async function replyToInstagramComment(
  commentId: string,
  text: string,
  igToken: string,
): Promise<void> {
  await axios.post(
    `${IG_GRAPH}/${commentId}/replies`,
    { message: text },
    { headers: { Authorization: `Bearer ${igToken}`, 'Content-Type': 'application/json' } },
  );
}

export async function hideInstagramComment(
  commentId: string,
  hide: boolean,
  igToken: string,
): Promise<void> {
  await axios.post(
    `${IG_GRAPH}/${commentId}`,
    { is_hidden: hide },
    { headers: { Authorization: `Bearer ${igToken}`, 'Content-Type': 'application/json' } },
  );
}
