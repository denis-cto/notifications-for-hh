import { NotificationType } from './type';
import { NotificationTypeMapper } from './notification-type';

describe('NotificationTypeMapper', () => {
  describe('bypassesQuietHours', () => {
    it('returns true for TRANSACTIONAL', () => {
      expect(
        NotificationTypeMapper.bypassesQuietHours(
          NotificationType.TRANSACTIONAL,
        ),
      ).toBe(true);
    });

    it('returns true for SECURITY', () => {
      expect(
        NotificationTypeMapper.bypassesQuietHours(NotificationType.SECURITY),
      ).toBe(true);
    });

    it('returns false for MARKETING', () => {
      expect(
        NotificationTypeMapper.bypassesQuietHours(NotificationType.MARKETING),
      ).toBe(false);
    });
  });

  describe('parse', () => {
    it.each([
      ['TRANSACTIONAL', NotificationType.TRANSACTIONAL],
      ['transactional', NotificationType.TRANSACTIONAL],
      ['Transactional', NotificationType.TRANSACTIONAL],
      ['MARKETING', NotificationType.MARKETING],
      ['marketing', NotificationType.MARKETING],
      ['SECURITY', NotificationType.SECURITY],
      ['security', NotificationType.SECURITY],
    ])('parses %s to %s', (input, expected) => {
      expect(NotificationTypeMapper.parse(input)).toBe(expected);
    });

    it.each(['invalid', '', 'UNKNOWN'])(
      'throws for invalid value %s',
      (input) => {
        expect(() => NotificationTypeMapper.parse(input)).toThrow(
          `Invalid notification type: ${input}`,
        );
      },
    );
  });

  describe('toApi', () => {
    it('lowercases notification type', () => {
      expect(NotificationTypeMapper.toApi(NotificationType.TRANSACTIONAL)).toBe(
        'transactional',
      );
      expect(NotificationTypeMapper.toApi(NotificationType.MARKETING)).toBe(
        'marketing',
      );
      expect(NotificationTypeMapper.toApi(NotificationType.SECURITY)).toBe(
        'security',
      );
    });
  });

  describe('fromApi', () => {
    it('round-trips via toApi', () => {
      for (const type of Object.values(NotificationType)) {
        expect(
          NotificationTypeMapper.fromApi(NotificationTypeMapper.toApi(type)),
        ).toBe(type);
      }
    });

    it('throws for invalid API value', () => {
      expect(() => NotificationTypeMapper.fromApi('invalid')).toThrow();
    });
  });
});
