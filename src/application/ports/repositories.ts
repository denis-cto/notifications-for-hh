import { Channel } from '../../domain/channel';
import { NotificationType } from '../../domain/notification-type';
import { QuietHoursConfig } from '../../domain/quiet-hours/quiet-hours';

export interface DefaultPreferenceRecord {
  type: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface UserRecord {
  id: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}

export interface UserPreferenceRecord {
  type: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface GlobalPolicyRecord {
  type: NotificationType | null;
  channel: Channel | null;
  region: string | null;
  effect: 'DENY' | 'ALLOW';
  reason: string;
  enabled: boolean;
}

export interface PreferenceUpdate {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface UpdatePreferencesInput {
  userId: string;
  preferences?: PreferenceUpdate[];
  quietHours?: QuietHoursConfig;
}

export const DEFAULT_PREFERENCE_REPOSITORY = Symbol('DEFAULT_PREFERENCE_REPOSITORY');
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const USER_PREFERENCE_REPOSITORY = Symbol('USER_PREFERENCE_REPOSITORY');
export const GLOBAL_POLICY_REPOSITORY = Symbol('GLOBAL_POLICY_REPOSITORY');
export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');
export const METRICS_RECORDER = Symbol('METRICS_RECORDER');

export interface DefaultPreferenceRepository {
  findAll(): Promise<DefaultPreferenceRecord[]>;
}

export interface UserRepository {
  findById(userId: string): Promise<UserRecord | null>;
  upsert(userId: string, quietHours?: QuietHoursConfig): Promise<UserRecord>;
}

export interface UserPreferenceRepository {
  findByUserId(userId: string): Promise<UserPreferenceRecord[]>;
  upsertMany(
    userId: string,
    preferences: PreferenceUpdate[],
  ): Promise<UserPreferenceRecord[]>;
}

export interface GlobalPolicyRepository {
  findAllEnabled(): Promise<GlobalPolicyRecord[]>;
}

export interface IdempotencyRepository {
  findByKey(key: string): Promise<{ requestHash: string } | null>;
  save(key: string, scope: string, requestHash: string): Promise<void>;
}

export interface MetricsRecorder {
  incrementDecision(decision: string, reason: string): void;
  observeEvaluateDuration(durationMs: number): void;
}
