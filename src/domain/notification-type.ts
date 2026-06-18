export enum NotificationType {
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING',
  SECURITY = 'SECURITY',
}

export const NOTIFICATION_TYPE_BYPASS_QUIET_HOURS: Record<
  NotificationType,
  boolean
> = {
  [NotificationType.TRANSACTIONAL]: true,
  [NotificationType.MARKETING]: false,
  [NotificationType.SECURITY]: true,
};

export function bypassesQuietHours(type: NotificationType): boolean {
  return NOTIFICATION_TYPE_BYPASS_QUIET_HOURS[type];
}

export function parseNotificationType(value: string): NotificationType {
  const normalized = value.toUpperCase();
  if (
    !Object.values(NotificationType).includes(normalized as NotificationType)
  ) {
    throw new Error(`Invalid notification type: ${value}`);
  }
  return normalized as NotificationType;
}

export function toApiNotificationType(type: NotificationType): string {
  return type.toLowerCase();
}

export function fromApiNotificationType(value: string): NotificationType {
  return parseNotificationType(value);
}
