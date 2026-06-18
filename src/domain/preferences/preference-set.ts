import { Channel } from '../channel';
import { NotificationType } from '../notification-type';

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
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export function mergePreferences(
  userId: string,
  defaults: Array<{ type: NotificationType; channel: Channel; enabled: boolean }>,
  userOverrides: Array<{
    type: NotificationType;
    channel: Channel;
    enabled: boolean;
  }>,
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  },
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

export function findEffectivePreference(
  preferences: PreferenceEntry[],
  type: NotificationType,
  channel: Channel,
): PreferenceEntry | undefined {
  return preferences.find(
    (p) => p.notificationType === type && p.channel === channel,
  );
}
