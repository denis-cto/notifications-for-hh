import { Channel } from '../../src/domain/channel';
import { NotificationType } from '../../src/domain/notification-type';
import { createRegion } from '../../src/domain/region';
import { QuietHours } from '../../src/domain/quiet-hours/quiet-hours';
import { PreferenceEntry } from '../../src/domain/preferences/preference-set';
import {
  GlobalPolicyRecord,
  GlobalPolicyRule,
} from '../../src/domain/evaluation/evaluation-rule';
import { PreferenceEvaluator } from '../../src/domain/evaluation/preference-evaluator';

describe('PreferenceEvaluator', () => {
  const basePreferences: PreferenceEntry[] = [
    {
      notificationType: NotificationType.TRANSACTIONAL,
      channel: Channel.EMAIL,
      enabled: true,
      source: 'default',
    },
    {
      notificationType: NotificationType.MARKETING,
      channel: Channel.EMAIL,
      enabled: false,
      source: 'default',
    },
    {
      notificationType: NotificationType.MARKETING,
      channel: Channel.PUSH,
      enabled: true,
      source: 'user',
    },
  ];

  const quietHours = QuietHours.create({
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Europe/Berlin',
  });

  const globalPolicies: GlobalPolicyRecord[] = [
    {
      type: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: 'EU',
      effect: 'DENY',
      reason: 'blocked_by_global_policy',
      enabled: true,
    },
  ];

  const evaluator = new PreferenceEvaluator();

  const buildContext = (overrides: Partial<Parameters<typeof evaluator.evaluate>[0]> = {}) => ({
    userId: 'user-1',
    notificationType: NotificationType.MARKETING,
    channel: Channel.EMAIL,
    region: createRegion('EU'),
    datetime: new Date('2026-05-21T10:00:00Z'),
    preferences: basePreferences,
    quietHours,
    globalPolicies,
    ...overrides,
  });

  it('denies when global policy matches', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.MARKETING,
        channel: Channel.SMS,
      }),
    );
    expect(decision.decision).toBe('deny');
    expect(decision.reason).toBe('blocked_by_global_policy');
  });

  it('denies disabled by default preference', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.MARKETING,
        channel: Channel.EMAIL,
      }),
    );
    expect(decision.decision).toBe('deny');
    expect(decision.reason).toBe('disabled_by_default');
  });

  it('denies disabled by user preference', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.MARKETING,
        channel: Channel.PUSH,
        preferences: [
          {
            notificationType: NotificationType.MARKETING,
            channel: Channel.PUSH,
            enabled: false,
            source: 'user',
          },
        ],
      }),
    );
    expect(decision.decision).toBe('deny');
    expect(decision.reason).toBe('disabled_by_user');
  });

  it('blocks marketing during quiet hours', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.MARKETING,
        channel: Channel.PUSH,
        datetime: new Date('2026-05-21T21:30:00Z'),
        preferences: [
          {
            notificationType: NotificationType.MARKETING,
            channel: Channel.PUSH,
            enabled: true,
            source: 'user',
          },
        ],
      }),
    );
    expect(decision.decision).toBe('deny');
    expect(decision.reason).toBe('blocked_by_quiet_hours');
  });

  it('allows transactional during quiet hours', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.TRANSACTIONAL,
        channel: Channel.EMAIL,
        datetime: new Date('2026-05-21T21:30:00Z'),
      }),
    );
    expect(decision.decision).toBe('allow');
  });

  it('allows enabled preference outside quiet hours', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.MARKETING,
        channel: Channel.PUSH,
        preferences: [
          {
            notificationType: NotificationType.MARKETING,
            channel: Channel.PUSH,
            enabled: true,
            source: 'user',
          },
        ],
      }),
    );
    expect(decision.decision).toBe('allow');
    expect(decision.reason).toBe('allowed');
  });
});

describe('Evaluation rule precedence', () => {
  it('global policy takes precedence over user preference', () => {
    const rule = new GlobalPolicyRule();
    const result = rule.evaluate({
      userId: 'u1',
      notificationType: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: createRegion('EU'),
      datetime: new Date(),
      preferences: [
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.SMS,
          enabled: true,
          source: 'user',
        },
      ],
      quietHours: QuietHours.disabled(),
      globalPolicies: [
        {
          type: NotificationType.MARKETING,
          channel: Channel.SMS,
          region: 'EU',
          effect: 'DENY',
          reason: 'blocked_by_global_policy',
          enabled: true,
        },
      ],
    });
    expect(result).not.toBe('continue');
    if (result !== 'continue') {
      expect(result.reason).toBe('blocked_by_global_policy');
    }
  });
});
