import { Channel, NotificationType } from '../type';
import { QuietHoursConfig } from '../quiet-hours/type';
import {
  PreferenceEntry,
  PreferenceRecord,
  PreferenceSet,
} from './type';

export type {
  PreferenceEntry,
  PreferenceRecord,
  PreferenceSet,
  PreferenceSource,
} from './type';

export class PreferenceSetMerger {
  static merge(
    userId: string,
    defaults: PreferenceRecord[],
    userOverrides: PreferenceRecord[],
    quietHours: QuietHoursConfig,
  ): PreferenceSet {
    const overrideMap = new Map<string, boolean>();
    for (const override of userOverrides) {
      overrideMap.set(`${override.type}:${override.channel}`, override.enabled);
    }

    const preferences: PreferenceEntry[] = defaults.map((def) => {
      const key = `${def.type}:${def.channel}`;
      const override = overrideMap.get(key);
      if (override !== undefined) {
        return {
          notificationType: def.type,
          channel: def.channel,
          enabled: override,
          source: 'user' as const,
        };
      }
      return {
        notificationType: def.type,
        channel: def.channel,
        enabled: def.enabled,
        source: 'default' as const,
      };
    });

    return { userId, preferences, quietHours };
  }

  static findEffective(
    preferences: PreferenceEntry[],
    type: NotificationType,
    channel: Channel,
  ): PreferenceEntry | undefined {
    return preferences.find(
      (p) => p.notificationType === type && p.channel === channel,
    );
  }
}
