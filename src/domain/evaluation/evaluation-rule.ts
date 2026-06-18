import { Channel } from '../channel';
import { Decision, RuleResult } from '../decision';
import {
  NotificationType,
  bypassesQuietHours,
} from '../notification-type';
import { Region } from '../region';
import { QuietHours } from '../quiet-hours/quiet-hours';
import { PreferenceEntry } from '../preferences/preference-set';

export interface EvaluationContext {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: Date;
  preferences: PreferenceEntry[];
  quietHours: QuietHours;
  globalPolicies: GlobalPolicyRecord[];
}

export interface GlobalPolicyRecord {
  type: NotificationType | null;
  channel: Channel | null;
  region: string | null;
  effect: 'DENY' | 'ALLOW';
  reason: string;
  enabled: boolean;
}

export interface EvaluationRule {
  evaluate(context: EvaluationContext): RuleResult;
}

export function matchesPolicy(
  policy: GlobalPolicyRecord,
  type: NotificationType,
  channel: Channel,
  region: Region,
): boolean {
  if (!policy.enabled) {
    return false;
  }
  if (policy.type !== null && policy.type !== type) {
    return false;
  }
  if (policy.channel !== null && policy.channel !== channel) {
    return false;
  }
  if (policy.region !== null && policy.region !== region) {
    return false;
  }
  return true;
}

export class GlobalPolicyRule implements EvaluationRule {
  evaluate(context: EvaluationContext): RuleResult {
    for (const policy of context.globalPolicies) {
      if (
        matchesPolicy(
          policy,
          context.notificationType,
          context.channel,
          context.region,
        ) &&
        policy.effect === 'DENY'
      ) {
        return Decision.deny(
          'blocked_by_global_policy',
          policy.reason || 'Blocked by global policy',
        );
      }
    }
    return 'continue';
  }
}

export class UserPreferenceRule implements EvaluationRule {
  evaluate(context: EvaluationContext): RuleResult {
    const pref = context.preferences.find(
      (p) =>
        p.notificationType === context.notificationType &&
        p.channel === context.channel,
    );

    if (!pref) {
      return Decision.deny(
        'disabled_by_default',
        'No preference configured for this type and channel',
      );
    }

    if (!pref.enabled) {
      const reason =
        pref.source === 'user' ? 'disabled_by_user' : 'disabled_by_default';
      return Decision.deny(reason, `Preference is disabled (${pref.source})`);
    }

    return 'continue';
  }
}

export class QuietHoursRule implements EvaluationRule {
  evaluate(context: EvaluationContext): RuleResult {
    const { notificationType, datetime, quietHours } = context;

    if (
      quietHours.isWithin(datetime) &&
      !bypassesQuietHours(notificationType)
    ) {
      return Decision.deny(
        'blocked_by_quiet_hours',
        `Notification blocked during quiet hours (${quietHours.start}-${quietHours.end} ${quietHours.timezone})`,
      );
    }

    return 'continue';
  }
}
