export type Channel = 'whatsapp' | 'instagram' | 'facebook';

export interface NormalizedInboundEvent {
  channel: Channel;
  accountId: string;   // phoneNumberId / pageId
  from: string;        // sender contact ID
  messageId: string;
  text: string | null;
  timestamp: number;
  raw: any;
  
  // Messages Identity Fields
  waId?: string | null;
  userId?: string | null;
  parentUserId?: string | null;
  username?: string | null;
  profileName?: string | null;

  // Statuses Identity Fields
  isStatus?: boolean;
  statusType?: string | null; // sent | delivered | read | failed
  recipientId?: string | null;
  recipientUserId?: string | null;
  parentRecipientUserId?: string | null;
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
