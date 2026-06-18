import { Channel } from '../../src/domain/channel';
import { NotificationType } from '../../src/domain/notification-type';
import { mergePreferences } from '../../src/domain/preferences/preference-set';

describe('mergePreferences', () => {
  const defaults = [
    {
      type: NotificationType.TRANSACTIONAL,
      channel: Channel.EMAIL,
      enabled: true,
    },
    {
      type: NotificationType.MARKETING,
      channel: Channel.EMAIL,
      enabled: false,
    },
  ];

  it('returns defaults for new user without overrides', () => {
    const result = mergePreferences('user-1', defaults, [], {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    });

    expect(result.userId).toBe('user-1');
    expect(result.preferences).toHaveLength(2);
    expect(result.preferences[0]).toMatchObject({
      notificationType: NotificationType.TRANSACTIONAL,
      channel: Channel.EMAIL,
      enabled: true,
      source: 'default',
    });
    expect(result.preferences[1]).toMatchObject({
      enabled: false,
      source: 'default',
    });
  });

  it('applies user overrides over defaults', () => {
    const result = mergePreferences(
      'user-1',
      defaults,
      [
        {
          type: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: false,
        },
      ],
      {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Europe/Berlin',
      },
    );

    const marketing = result.preferences.find(
      (p) =>
        p.notificationType === NotificationType.MARKETING &&
        p.channel === Channel.EMAIL,
    );
    expect(marketing).toMatchObject({ enabled: false, source: 'user' });
    expect(result.quietHours.timezone).toBe('Europe/Berlin');
  });
});
