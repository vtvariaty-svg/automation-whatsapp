export type Channel = 'whatsapp' | 'instagram' | 'facebook';

export interface NormalizedInboundEvent {
  channel: Channel;
  accountId: string;   // phoneNumberId / pageId
  from: string;        // sender contact ID
  messageId: string;
  text: string | null;
  timestamp: number;
  raw: unknown;
}

export interface ChannelSendConfig {
  phoneId?: string;  // whatsapp
  pageId?: string;   // instagram / facebook
  token: string;
}

export interface NormalizedOutboundEvent {
  channel: Channel;
  to: string;
  text: string;
  config: ChannelSendConfig;
}
