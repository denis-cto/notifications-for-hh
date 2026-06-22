import { Channel, NotificationType, Region } from '../type';
import { Decision } from '../decision';
import { QuietHours } from '../quiet-hours/quiet-hours';
import { PreferenceEntry } from '../preferences/type';

export type RuleResult = 'continue' | Decision;

export interface GlobalPolicyRecord {
  type: NotificationType | null;
  channel: Channel | null;
  region: string | null;
  effect: 'DENY' | 'ALLOW';
  reason: string;
  enabled: boolean;
}

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

export interface EvaluationRule {
  evaluate(context: EvaluationContext): RuleResult;
}
