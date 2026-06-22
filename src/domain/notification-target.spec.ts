import { Channel, NotificationType } from './type';
import { NotificationTargetMapper } from './notification-target';

describe('NotificationTargetMapper', () => {
  describe('parse', () => {
    it.each([
      ['marketing_email', NotificationType.MARKETING, Channel.EMAIL],
      ['transactional_sms', NotificationType.TRANSACTIONAL, Channel.SMS],
      ['security_push', NotificationType.SECURITY, Channel.PUSH],
      ['MARKETING_EMAIL', NotificationType.MARKETING, Channel.EMAIL],
    ])('parses composite %s', (input, expectedType, expectedChannel) => {
      const result = NotificationTargetMapper.parse(input);
      expect(result.notificationType).toBe(expectedType);
      expect(result.channel).toBe(expectedChannel);
    });

    it('parses plain type as email channel', () => {
      const result = NotificationTargetMapper.parse('marketing');
      expect(result).toEqual({
        notificationType: NotificationType.MARKETING,
        channel: Channel.EMAIL,
      });
    });

    it('throws for invalid composite type', () => {
      expect(() => NotificationTargetMapper.parse('unknown_email')).toThrow(
        'Invalid notification type: unknown',
      );
    });
  });

  describe('fromApi', () => {
    it('uses separate fields when channel is provided', () => {
      const result = NotificationTargetMapper.fromApi('marketing', 'sms');
      expect(result).toEqual({
        notificationType: NotificationType.MARKETING,
        channel: Channel.SMS,
      });
    });

    it('parses composite when channel is omitted', () => {
      const result = NotificationTargetMapper.fromApi('marketing_email');
      expect(result).toEqual({
        notificationType: NotificationType.MARKETING,
        channel: Channel.EMAIL,
      });
    });
  });
});
