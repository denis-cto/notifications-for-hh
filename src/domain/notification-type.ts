import { NotificationType } from './type';

export { NotificationType } from './type';

export class NotificationTypeMapper {
  private static readonly bypassQuietHoursMap: Record<
    NotificationType,
    boolean
  > = {
    [NotificationType.TRANSACTIONAL]: true,
    [NotificationType.MARKETING]: false,
    [NotificationType.SECURITY]: true,
  };

  static bypassesQuietHours(type: NotificationType): boolean {
    return NotificationTypeMapper.bypassQuietHoursMap[type];
  }

  static parse(value: string): NotificationType {
    const normalized = value.toUpperCase();
    if (
      !Object.values(NotificationType).includes(normalized as NotificationType)
    ) {
      throw new Error(`Invalid notification type: ${value}`);
    }
    return normalized as NotificationType;
  }

  static toApi(type: NotificationType): string {
    return type.toLowerCase();
  }

  static fromApi(value: string): NotificationType {
    return NotificationTypeMapper.parse(value);
  }
}
