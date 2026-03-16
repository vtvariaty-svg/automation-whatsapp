/**
 * L4 – Dead-letter queue.
 * Persists failed send events so operators can inspect and replay.
 * Non-blocking — errors here must not crash the caller.
 */
import { prisma } from '@/lib/prisma';

export interface DeadLetterPayload {
  event: string;         // e.g. "send_message", "sequence_step"
  channel: string;
  tenantId: string;
  to?: string;
  text?: string;
  [key: string]: unknown;
}

export async function pushDeadLetter(
  payload: DeadLetterPayload,
  error: string,
  attempts = 1,
): Promise<void> {
  try {
    await prisma.deadLetterEvent.create({
      data: {
        tenantId: payload.tenantId,
        channel: payload.channel,
        event: payload.event,
        payload: payload as any,
        error: error.slice(0, 2000),
        attempts,
        status: 'failed',
      },
    });
  } catch (e) {
    console.error('[DeadLetter] Failed to persist dead-letter event:', e);
  }
}

export async function resolveDeadLetter(id: string): Promise<void> {
  await prisma.deadLetterEvent.update({
    where: { id },
    data: { status: 'resolved', resolvedAt: new Date() },
  });
}
