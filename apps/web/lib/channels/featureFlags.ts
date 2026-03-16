export interface TenantFlags {
  enabledChannels?: string | null;
}

export function isChannelEnabled(tenant: TenantFlags, channel: string): boolean {
  if (!tenant.enabledChannels) return channel === 'whatsapp';
  return tenant.enabledChannels.split(',').map((c) => c.trim()).includes(channel);
}

export function getEnabledChannels(tenant: TenantFlags): string[] {
  if (!tenant.enabledChannels) return ['whatsapp'];
  return tenant.enabledChannels.split(',').map((c) => c.trim()).filter(Boolean);
}

export function addChannel(current: string | null | undefined, channel: string): string {
  const channels = getEnabledChannels({ enabledChannels: current });
  if (!channels.includes(channel)) channels.push(channel);
  return channels.join(',');
}

export function removeChannel(current: string | null | undefined, channel: string): string {
  const channels = getEnabledChannels({ enabledChannels: current });
  return channels.filter((c) => c !== channel).join(',') || 'whatsapp';
}
