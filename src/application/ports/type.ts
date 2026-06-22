import { Channel, NotificationType } from '../../domain/type';
import { QuietHoursConfig } from '../../domain/quiet-hours/type';
import { GlobalPolicyRecord } from '../../domain/evaluation/type';

export type { GlobalPolicyRecord };

export interface DefaultPreferenceRecord {
  type: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface GlobalPolicyRecordWithId extends GlobalPolicyRecord {
  id: string;
}

export interface CreateGlobalPolicyInput {
  type?: NotificationType | null;
  channel?: Channel | null;
  region?: string | null;
  effect: 'DENY' | 'ALLOW';
  reason: string;
  enabled?: boolean;
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

export interface DefaultPreferenceRepository {
  findAll(): Promise<DefaultPreferenceRecord[]>;
  upsertMany(
    preferences: DefaultPreferenceRecord[],
  ): Promise<DefaultPreferenceRecord[]>;
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
  findAll(): Promise<GlobalPolicyRecordWithId[]>;
  create(input: CreateGlobalPolicyInput): Promise<GlobalPolicyRecordWithId>;
}

export interface IdempotencyRepository {
  findByKey(key: string): Promise<{ requestHash: string } | null>;
  save(key: string, scope: string, requestHash: string): Promise<void>;
}

export interface MetricsRecorder {
  incrementDecision(decision: string, reason: string): void;
  observeEvaluateDuration(durationMs: number): void;
}
