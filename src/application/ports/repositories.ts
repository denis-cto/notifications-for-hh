export const DEFAULT_PREFERENCE_REPOSITORY = Symbol('DEFAULT_PREFERENCE_REPOSITORY');
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const USER_PREFERENCE_REPOSITORY = Symbol('USER_PREFERENCE_REPOSITORY');
export const GLOBAL_POLICY_REPOSITORY = Symbol('GLOBAL_POLICY_REPOSITORY');
export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');
export const METRICS_RECORDER = Symbol('METRICS_RECORDER');

export type {
  CreateGlobalPolicyInput,
  DefaultPreferenceRecord,
  DefaultPreferenceRepository,
  GlobalPolicyRecord,
  GlobalPolicyRecordWithId,
  GlobalPolicyRepository,
  IdempotencyRepository,
  MetricsRecorder,
  PreferenceUpdate,
  UpdatePreferencesInput,
  UserPreferenceRecord,
  UserPreferenceRepository,
  UserRecord,
  UserRepository,
} from './type';
