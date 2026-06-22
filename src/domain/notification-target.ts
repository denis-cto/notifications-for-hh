import { Channel } from './type';
import { ChannelMapper } from './channel';
import { NotificationType, NotificationTypeMapper } from './notification-type';

export interface NotificationTarget {
  notificationType: NotificationType;
  channel: Channel;
}

export class NotificationTargetMapper {
  static parse(value: string): NotificationTarget {
    const normalized = value.toLowerCase().trim();
    const composite = NotificationTargetMapper.tryParseComposite(normalized);
    if (composite) {
      return composite;
    }
    return {
      notificationType: NotificationTypeMapper.parse(value),
      channel: Channel.EMAIL,
    };
  }

  static fromApi(
    notificationType: string,
    channel?: string,
  ): NotificationTarget {
    if (channel !== undefined && channel !== '') {
      return {
        notificationType: NotificationTypeMapper.fromApi(notificationType),
        channel: ChannelMapper.fromApi(channel),
      };
    }
    return NotificationTargetMapper.parse(notificationType);
  }

  private static tryParseComposite(value: string): NotificationTarget | null {
    const channels = Object.values(Channel).map((c) => c.toLowerCase());
    for (const channelName of channels) {
      const suffix = `_${channelName}`;
      if (!value.endsWith(suffix)) {
        continue;
      }
      const typePart = value.slice(0, -suffix.length);
      if (!typePart) {
        continue;
      }
      return {
        notificationType: NotificationTypeMapper.parse(typePart),
        channel: ChannelMapper.parse(channelName),
      };
    }
    return null;
  }
}
