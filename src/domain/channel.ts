export enum Channel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  MESSENGER = 'MESSENGER',
}

export function parseChannel(value: string): Channel {
  const normalized = value.toUpperCase();
  if (!Object.values(Channel).includes(normalized as Channel)) {
    throw new Error(`Invalid channel: ${value}`);
  }
  return normalized as Channel;
}

export function toApiChannel(channel: Channel): string {
  return channel.toLowerCase();
}

export function fromApiChannel(value: string): Channel {
  return parseChannel(value);
}
