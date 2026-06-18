export type DecisionOutcome = 'allow' | 'deny';

export type ReasonCode =
  | 'allowed'
  | 'allowed_by_default'
  | 'disabled_by_user'
  | 'disabled_by_default'
  | 'blocked_by_global_policy'
  | 'blocked_by_quiet_hours';

export class Decision {
  readonly decision: DecisionOutcome;
  readonly reason: ReasonCode;
  readonly explanation?: string;

  private constructor(
    decision: DecisionOutcome,
    reason: ReasonCode,
    explanation?: string,
  ) {
    this.decision = decision;
    this.reason = reason;
    this.explanation = explanation;
  }

  static allow(reason: ReasonCode = 'allowed', explanation?: string): Decision {
    return new Decision('allow', reason, explanation);
  }

  static deny(reason: ReasonCode, explanation?: string): Decision {
    return new Decision('deny', reason, explanation);
  }

  isAllowed(): boolean {
    return this.decision === 'allow';
  }
}

export type RuleResult = 'continue' | Decision;
