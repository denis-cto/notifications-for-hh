export interface EvaluateInput {
  userId: string;
  notificationType: string;
  channel?: string;
  region: string;
  datetime: string;
}

export interface EvaluateOutput {
  decision: 'allow' | 'deny';
  reason: string;
  explanation?: string;
}
