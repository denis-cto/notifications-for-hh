import { Channel, NotificationType } from '../type';
import { RegionMapper } from '../region';
import { QuietHours } from '../quiet-hours/quiet-hours';
import { PreferenceEntry } from '../preferences/type';
import {
  GlobalPolicyRecord,
  GlobalPolicyRule,
  QuietHoursRule,
  UserPreferenceRule,
} from './evaluation-rule';
import { EvaluationContext } from './type';

describe('GlobalPolicyRule', () => {
  const basePolicy: GlobalPolicyRecord = {
    type: NotificationType.MARKETING,
    channel: Channel.SMS,
    region: 'EU',
    effect: 'DENY',
    reason: 'blocked_by_global_policy',
    enabled: true,
  };

  describe('matches', () => {
    it('returns true when all fields match', () => {
      expect(
        GlobalPolicyRule.matches(
          basePolicy,
          NotificationType.MARKETING,
          Channel.SMS,
          RegionMapper.create('EU'),
        ),
      ).toBe(true);
    });

    it('returns false when policy is disabled', () => {
      expect(
        GlobalPolicyRule.matches(
          { ...basePolicy, enabled: false },
          NotificationType.MARKETING,
          Channel.SMS,
          RegionMapper.create('EU'),
        ),
      ).toBe(false);
    });

    it('treats null type as wildcard', () => {
      expect(
        GlobalPolicyRule.matches(
          { ...basePolicy, type: null },
          NotificationType.TRANSACTIONAL,
          Channel.SMS,
          RegionMapper.create('EU'),
        ),
      ).toBe(true);
    });

    it('treats null channel as wildcard', () => {
      expect(
        GlobalPolicyRule.matches(
          { ...basePolicy, channel: null },
          NotificationType.MARKETING,
          Channel.EMAIL,
          RegionMapper.create('EU'),
        ),
      ).toBe(true);
    });

    it('treats null region as wildcard', () => {
      expect(
        GlobalPolicyRule.matches(
          { ...basePolicy, region: null },
          NotificationType.MARKETING,
          Channel.SMS,
          RegionMapper.create('US'),
        ),
      ).toBe(true);
    });

    it('returns false when type does not match', () => {
      expect(
        GlobalPolicyRule.matches(
          basePolicy,
          NotificationType.TRANSACTIONAL,
          Channel.SMS,
          RegionMapper.create('EU'),
        ),
      ).toBe(false);
    });

    it('returns false when channel does not match', () => {
      expect(
        GlobalPolicyRule.matches(
          basePolicy,
          NotificationType.MARKETING,
          Channel.EMAIL,
          RegionMapper.create('EU'),
        ),
      ).toBe(false);
    });

    it('returns false when region does not match', () => {
      expect(
        GlobalPolicyRule.matches(
          basePolicy,
          NotificationType.MARKETING,
          Channel.SMS,
          RegionMapper.create('US'),
        ),
      ).toBe(false);
    });
  });

  describe('evaluate', () => {
    const rule = new GlobalPolicyRule();

    const buildContext = (
      overrides: Partial<EvaluationContext> = {},
    ): EvaluationContext => ({
      userId: 'user-1',
      notificationType: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: RegionMapper.create('EU'),
      datetime: new Date('2026-05-21T10:00:00Z'),
      preferences: [],
      quietHours: QuietHours.disabled(),
      globalPolicies: [basePolicy],
      ...overrides,
    });

    it('returns deny when matching DENY policy', () => {
      const result = rule.evaluate(buildContext());
      expect(result).not.toBe('continue');
      if (result !== 'continue') {
        expect(result.decision).toBe('deny');
        expect(result.reason).toBe('blocked_by_global_policy');
        expect(result.explanation).toBe('blocked_by_global_policy');
      }
    });

    it('uses fallback explanation when policy reason is empty', () => {
      const result = rule.evaluate(
        buildContext({
          globalPolicies: [{ ...basePolicy, reason: '' }],
        }),
      );
      expect(result).not.toBe('continue');
      if (result !== 'continue') {
        expect(result.explanation).toBe('Blocked by global policy');
      }
    });

    it('returns continue for ALLOW effect', () => {
      const result = rule.evaluate(
        buildContext({
          globalPolicies: [{ ...basePolicy, effect: 'ALLOW' }],
        }),
      );
      expect(result).toBe('continue');
    });

    it('returns continue when no policy matches', () => {
      const result = rule.evaluate(
        buildContext({
          notificationType: NotificationType.TRANSACTIONAL,
          channel: Channel.EMAIL,
        }),
      );
      expect(result).toBe('continue');
    });

    it('returns continue when global policies list is empty', () => {
      const result = rule.evaluate(buildContext({ globalPolicies: [] }));
      expect(result).toBe('continue');
    });
  });
});

describe('UserPreferenceRule', () => {
  const rule = new UserPreferenceRule();

  const buildContext = (
    preferences: PreferenceEntry[],
    overrides: Partial<EvaluationContext> = {},
  ): EvaluationContext => ({
    userId: 'user-1',
    notificationType: NotificationType.MARKETING,
    channel: Channel.EMAIL,
    region: RegionMapper.create('EU'),
    datetime: new Date('2026-05-21T10:00:00Z'),
    preferences,
    quietHours: QuietHours.disabled(),
    globalPolicies: [],
    ...overrides,
  });

  it('denies when no matching preference exists', () => {
    const result = rule.evaluate(buildContext([]));
    expect(result).not.toBe('continue');
    if (result !== 'continue') {
      expect(result.reason).toBe('disabled_by_default');
      expect(result.explanation).toBe(
        'No preference configured for this type and channel',
      );
    }
  });

  it('denies when preference is disabled by user', () => {
    const result = rule.evaluate(
      buildContext([
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: false,
          source: 'user',
        },
      ]),
    );
    expect(result).not.toBe('continue');
    if (result !== 'continue') {
      expect(result.reason).toBe('disabled_by_user');
      expect(result.explanation).toBe('Preference is disabled (user)');
    }
  });

  it('denies when preference is disabled by default', () => {
    const result = rule.evaluate(
      buildContext([
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: false,
          source: 'default',
        },
      ]),
    );
    expect(result).not.toBe('continue');
    if (result !== 'continue') {
      expect(result.reason).toBe('disabled_by_default');
      expect(result.explanation).toBe('Preference is disabled (default)');
    }
  });

  it('returns continue when preference is enabled', () => {
    const result = rule.evaluate(
      buildContext([
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: true,
          source: 'user',
        },
      ]),
    );
    expect(result).toBe('continue');
  });
});

describe('QuietHoursRule', () => {
  const rule = new QuietHoursRule();

  const quietHours = QuietHours.create({
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Europe/Berlin',
  });

  const buildContext = (
    overrides: Partial<EvaluationContext> = {},
  ): EvaluationContext => ({
    userId: 'user-1',
    notificationType: NotificationType.MARKETING,
    channel: Channel.EMAIL,
    region: RegionMapper.create('EU'),
    datetime: new Date('2026-05-21T21:30:00Z'),
    preferences: [
      {
        notificationType: NotificationType.MARKETING,
        channel: Channel.EMAIL,
        enabled: true,
        source: 'user',
      },
    ],
    quietHours,
    globalPolicies: [],
    ...overrides,
  });

  it('denies non-bypass type during quiet hours', () => {
    const result = rule.evaluate(buildContext());
    expect(result).not.toBe('continue');
    if (result !== 'continue') {
      expect(result.reason).toBe('blocked_by_quiet_hours');
      expect(result.explanation).toContain('22:00-08:00');
      expect(result.explanation).toContain('Europe/Berlin');
    }
  });

  it('returns continue for bypass type during quiet hours', () => {
    const result = rule.evaluate(
      buildContext({
        notificationType: NotificationType.TRANSACTIONAL,
        preferences: [
          {
            notificationType: NotificationType.TRANSACTIONAL,
            channel: Channel.EMAIL,
            enabled: true,
            source: 'default',
          },
        ],
      }),
    );
    expect(result).toBe('continue');
  });

  it('returns continue outside quiet hours', () => {
    const result = rule.evaluate(
      buildContext({
        datetime: new Date('2026-05-21T10:00:00Z'),
      }),
    );
    expect(result).toBe('continue');
  });
});
