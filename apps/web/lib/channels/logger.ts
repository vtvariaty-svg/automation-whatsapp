import type { Channel } from './types';

export interface LogCtx {
  channel: Channel;
  tenantId?: string;
  from?: string;
  messageId?: string;
  correlationId?: string; // L4: request-scoped trace ID
  conversationId?: string; // L4: DB conversation ID
  [key: string]: unknown;
}

/** Generate a short correlation ID for a request. */
export function newCorrelationId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emit(level: 'info' | 'warn' | 'error', ctx: LogCtx, msg: string): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...ctx, msg });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const channelLog = {
  info: (ctx: LogCtx, msg: string) => emit('info', ctx, msg),
  warn: (ctx: LogCtx, msg: string) => emit('warn', ctx, msg),
  error: (ctx: LogCtx, msg: string) => emit('error', ctx, msg),
};
