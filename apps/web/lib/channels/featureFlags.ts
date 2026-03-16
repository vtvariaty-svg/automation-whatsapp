export interface TenantFlags {
  enabledChannels?: string | null;
  channelKillSwitch?: string | null; // L4
}

/**
 * Returns true only if the channel is both enabled AND not kill-switched.
 * Kill switch takes precedence — allows emergency pause without disconnecting.
 */
export function isChannelEnabled(tenant: TenantFlags, channel: string): boolean {
  // L4 kill switch check
  if (tenant.channelKillSwitch) {
    const killed = tenant.channelKillSwitch.split(',').map((c) => c.trim());
    if (killed.includes(channel)) return false;
  }
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
