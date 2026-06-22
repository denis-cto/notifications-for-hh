import { Channel, NotificationType } from '../type';
import { Decision } from '../decision';
import { RegionMapper } from '../region';
import { QuietHours } from '../quiet-hours/quiet-hours';
import { PreferenceEntry } from '../preferences/type';
import {
  GlobalPolicyRecord,
  GlobalPolicyRule,
  QuietHoursRule,
  UserPreferenceRule,
} from './evaluation-rule';
import { PreferenceEvaluator } from './preference-evaluator';
import { EvaluationContext, EvaluationRule } from './type';

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

  const buildContext = (
    overrides: Partial<EvaluationContext> = {},
  ): EvaluationContext => ({
    userId: 'user-1',
    notificationType: NotificationType.MARKETING,
    channel: Channel.EMAIL,
    region: RegionMapper.create('EU'),
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

  it('returns allowed_by_default for enabled default preference', () => {
    const decision = evaluator.evaluate(
      buildContext({
        notificationType: NotificationType.TRANSACTIONAL,
        channel: Channel.EMAIL,
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
    expect(decision.decision).toBe('allow');
    expect(decision.reason).toBe('allowed_by_default');
  });

  it('uses custom rules array when provided', () => {
    const customRule: EvaluationRule = {
      evaluate: () =>
        Decision.deny('blocked_by_global_policy', 'Custom rule'),
    };
    const customEvaluator = new PreferenceEvaluator([customRule]);
    const decision = customEvaluator.evaluate(buildContext());
    expect(decision.decision).toBe('deny');
    expect(decision.explanation).toBe('Custom rule');
  });
});

describe('Evaluation rule precedence', () => {
  it('global policy takes precedence over user preference', () => {
    const rule = new GlobalPolicyRule();
    const result = rule.evaluate({
      userId: 'u1',
      notificationType: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: RegionMapper.create('EU'),
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

  it('global policy takes precedence over quiet hours', () => {
    const evaluator = new PreferenceEvaluator();
    const decision = evaluator.evaluate({
      userId: 'u1',
      notificationType: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: RegionMapper.create('EU'),
      datetime: new Date('2026-05-21T21:30:00Z'),
      preferences: [
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.SMS,
          enabled: true,
          source: 'user',
        },
      ],
      quietHours: QuietHours.create({
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Europe/Berlin',
      }),
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
    expect(decision.decision).toBe('deny');
    expect(decision.reason).toBe('blocked_by_global_policy');
  });

  it('user preference is evaluated before quiet hours', () => {
    const userRule = new UserPreferenceRule();
    const quietRule = new QuietHoursRule();
    const context: EvaluationContext = {
      userId: 'u1',
      notificationType: NotificationType.MARKETING,
      channel: Channel.EMAIL,
      region: RegionMapper.create('EU'),
      datetime: new Date('2026-05-21T21:30:00Z'),
      preferences: [
        {
          notificationType: NotificationType.MARKETING,
          channel: Channel.EMAIL,
          enabled: false,
          source: 'default' as const,
        },
      ],
      quietHours: QuietHours.create({
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Europe/Berlin',
      }),
      globalPolicies: [],
    };
    expect(userRule.evaluate(context)).not.toBe('continue');
    expect(quietRule.evaluate(context)).not.toBe('continue');
    const evaluator = new PreferenceEvaluator([
      new GlobalPolicyRule(),
      userRule,
      quietRule,
    ]);
    const decision = evaluator.evaluate(context);
    expect(decision.reason).toBe('disabled_by_default');
  });
});
