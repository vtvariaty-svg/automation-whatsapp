/**
 * Outbound persistence rule — applied consistently to ALL webhook reply branches:
 *
 *   1. SEND the message via the WhatsApp API.
 *   2. SAVE to DB only after a successful send.
 *   3. If the send fails → log the error, skip the DB save.
 *
 * Rationale: conversation history must only contain messages the customer
 * actually received. Persisting a message that was never delivered creates a
 * false record that agents may act on incorrectly and masks delivery failures.
 *
 * Exception handled here: if the send succeeds but the DB save fails we log
 * the error (so an operator can reconcile) and still return 'sent' — the
 * customer did receive the message and the flow should continue normally.
 */

import { channelLog } from '@/lib/channels/logger';
// @ts-ignore - Importing from JS/untyped service file
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
// @ts-ignore - Importing from JS/untyped service file
import { saveAIMessage } from '@/src/services/conversationService';

export type IdentityContext = {
  contactId: string;
  confidence: 'high' | 'ambiguous';
};

export type SendAndSaveResult = 'sent' | 'send_failed';

export async function sendAndSave({
  to,
  message,
  phoneId,
  token,
  tenantId,
  status,
  aiGenerated = true,
  channel = 'whatsapp',
  identity,
  logContext = {},
}: {
  to: string;
  message: string;
  phoneId: string | null | undefined;
  token: string | null | undefined;
  tenantId: string;
  status: string;
  aiGenerated?: boolean;
  channel?: string;
  identity?: IdentityContext;
  logContext?: Record<string, unknown>;
}): Promise<SendAndSaveResult> {
  // Step 1: send
  try {
    await (sendWhatsAppMessage as any)(to, message, phoneId, token);
  } catch (sendErr: any) {
    channelLog.error(
      {
        channel: channel as any,
        tenantId,
        error: sendErr?.response?.data ?? sendErr?.message ?? String(sendErr),
        ...logContext,
      },
      '[sendAndSave] Falha ao enviar mensagem — DB save ignorado (mensagem não entregue)'
    );
    return 'send_failed';
  }

  // Step 2: save (send already confirmed above)
  try {
    await (saveAIMessage as any)(to, message, tenantId, status, aiGenerated, channel, identity);
  } catch (saveErr: any) {
    channelLog.error(
      {
        channel: channel as any,
        tenantId,
        error: saveErr?.message ?? String(saveErr),
        ...logContext,
      },
      '[sendAndSave] Mensagem enviada mas falhou ao salvar no histórico — reconciliação manual necessária'
    );
    // Return 'sent': the customer received the message, flow should continue normally.
  }

  return 'sent';
}
