import { Decision } from '../decision';
import {
  GlobalPolicyRule,
  QuietHoursRule,
  UserPreferenceRule,
} from './evaluation-rule';
import { EvaluationContext, EvaluationRule } from './type';

export class PreferenceEvaluator {
  private readonly rules: EvaluationRule[];

  constructor(rules?: EvaluationRule[]) {
    this.rules = rules ?? [
      new GlobalPolicyRule(),
      new UserPreferenceRule(),
      new QuietHoursRule(),
    ];
  }

  evaluate(context: EvaluationContext): Decision {
    for (const rule of this.rules) {
      const result = rule.evaluate(context);
      if (result !== 'continue') {
        return result;
      }
    }

    const pref = context.preferences.find(
      (p) =>
        p.notificationType === context.notificationType &&
        p.channel === context.channel,
    );
    const reason = pref?.source === 'default' ? 'allowed_by_default' : 'allowed';
    return Decision.allow(reason);
  }
}
