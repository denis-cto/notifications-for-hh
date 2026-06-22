import { Channel, NotificationType } from '../type';
import { PreferenceSetMerger } from './preference-set';

describe('PreferenceSetMerger', () => {
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

  const quietHoursConfig = {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  };

  it('returns defaults for new user without overrides', () => {
    const result = PreferenceSetMerger.merge('user-1', defaults, [], quietHoursConfig);
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
    const result = PreferenceSetMerger.merge(
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

  it('marks override that enables preference as user source', () => {
    const result = PreferenceSetMerger.merge(
      'user-1',
      defaults,
      [
        {
          type: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: true,
        },
      ],
      quietHoursConfig,
    );
    const marketing = result.preferences.find(
      (p) =>
        p.notificationType === NotificationType.MARKETING &&
        p.channel === Channel.EMAIL,
    );
    expect(marketing).toMatchObject({ enabled: true, source: 'user' });
  });

  it('ignores override with no matching default', () => {
    const result = PreferenceSetMerger.merge(
      'user-1',
      defaults,
      [
        {
          type: NotificationType.SECURITY,
          channel: Channel.PUSH,
          enabled: true,
        },
      ],
      quietHoursConfig,
    );
    expect(result.preferences).toHaveLength(2);
    expect(
      result.preferences.find(
        (p) =>
          p.notificationType === NotificationType.SECURITY &&
          p.channel === Channel.PUSH,
      ),
    ).toBeUndefined();
  });

  it('returns empty preferences when defaults are empty', () => {
    const result = PreferenceSetMerger.merge('user-1', [], [], quietHoursConfig);
    expect(result.preferences).toEqual([]);
  });

  describe('findEffective', () => {
    const preferences = [
      {
        notificationType: NotificationType.TRANSACTIONAL,
        channel: Channel.EMAIL,
        enabled: true,
        source: 'default' as const,
      },
      {
        notificationType: NotificationType.MARKETING,
        channel: Channel.PUSH,
        enabled: true,
        source: 'user' as const,
      },
    ];

    it('returns matching preference entry', () => {
      const result = PreferenceSetMerger.findEffective(
        preferences,
        NotificationType.MARKETING,
        Channel.PUSH,
      );
      expect(result).toEqual(preferences[1]);
    });

    it('returns undefined when no match exists', () => {
      const result = PreferenceSetMerger.findEffective(
        preferences,
        NotificationType.SECURITY,
        Channel.SMS,
      );
      expect(result).toBeUndefined();
    });
  });
});
