import { Channel, NotificationType } from '../type';
import { QuietHoursConfig } from '../quiet-hours/type';

export type PreferenceSource = 'user' | 'default';

export interface PreferenceEntry {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
  source: PreferenceSource;
}

export interface PreferenceSet {
  userId: string;
  preferences: PreferenceEntry[];
  quietHours: QuietHoursConfig;
}

export interface PreferenceRecord {
  type: NotificationType;
  channel: Channel;
  enabled: boolean;
}
