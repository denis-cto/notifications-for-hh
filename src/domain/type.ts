export enum Channel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  MESSENGER = 'MESSENGER',
}

export enum NotificationType {
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING',
  SECURITY = 'SECURITY',
}

export type Region = string & { readonly __brand: unique symbol };

export type DecisionOutcome = 'allow' | 'deny';

export type ReasonCode =
  | 'allowed'
  | 'allowed_by_default'
  | 'disabled_by_user'
  | 'disabled_by_default'
  | 'blocked_by_global_policy'
  | 'blocked_by_quiet_hours';
