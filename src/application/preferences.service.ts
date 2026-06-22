import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  DefaultPreferenceRepository,
  IDEMPOTENCY_REPOSITORY,
  IdempotencyRepository,
  UpdatePreferencesInput,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
  UserPreferenceRepository,
  UserRepository,
} from './ports/repositories';
import { PreferenceEntry, PreferenceSet } from '../domain/preferences/type';
import { PreferenceSetMerger } from '../domain/preferences/preference-set';
import { ChannelMapper } from '../domain/channel';
import { NotificationTypeMapper } from '../domain/notification-type';
import { NotificationTargetMapper } from '../domain/notification-target';
import { QuietHours } from '../domain/quiet-hours/quiet-hours';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(
    @Inject(DEFAULT_PREFERENCE_REPOSITORY)
    private readonly defaultPreferenceRepo: DefaultPreferenceRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly userPreferenceRepo: UserPreferenceRepository,
    @Inject(IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepo: IdempotencyRepository,
  ) {}

  async getPreferences(userId: string): Promise<PreferenceSet> {
    return this.buildPreferenceSet(userId);
  }

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput,
    idempotencyKey?: string,
  ): Promise<PreferenceSet> {
    const requestHash = this.hashRequest(input);

    if (idempotencyKey) {
      const existing = await this.idempotencyRepo.findByKey(idempotencyKey);
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ConflictException(
            'Idempotency key reused with different payload',
          );
        }
        return this.buildPreferenceSet(userId);
      }
    }

    if (input.quietHours) {
      QuietHours.create(input.quietHours);
      await this.userRepo.upsert(userId, input.quietHours);
    } else if (input.preferences?.length) {
      await this.userRepo.upsert(userId);
    }

    if (input.preferences?.length) {
      await this.userPreferenceRepo.upsertMany(userId, input.preferences);
    }

    if (idempotencyKey) {
      await this.idempotencyRepo.save(
        idempotencyKey,
        `preferences:${userId}`,
        requestHash,
      );
    }

    this.logger.log({
      event: 'preference_changed',
      userId,
      preferencesUpdated: input.preferences?.length ?? 0,
      quietHoursUpdated: Boolean(input.quietHours),
    });

    return this.buildPreferenceSet(userId);
  }

  async buildPreferenceSet(userId: string): Promise<PreferenceSet> {
    const [defaults, userOverrides, user] = await Promise.all([
      this.defaultPreferenceRepo.findAll(),
      this.userPreferenceRepo.findByUserId(userId),
      this.userRepo.findById(userId),
    ]);

    const quietHours = user
      ? {
          enabled: user.quietHoursEnabled,
          start: user.quietHoursStart ?? '22:00',
          end: user.quietHoursEnd ?? '08:00',
          timezone: user.timezone,
        }
      : {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC',
        };

    return PreferenceSetMerger.merge(userId, defaults, userOverrides, quietHours);
  }

  toApiResponse(preferenceSet: PreferenceSet) {
    return {
      userId: preferenceSet.userId,
      preferences: preferenceSet.preferences.map((p: PreferenceEntry) => ({
        notificationType: NotificationTypeMapper.toApi(p.notificationType),
        channel: ChannelMapper.toApi(p.channel),
        enabled: p.enabled,
        source: p.source,
      })),
      quietHours: preferenceSet.quietHours,
    };
  }

  parseUpdateInput(body: {
    preferences?: Array<{
      notificationType: string;
      channel?: string;
      enabled: boolean;
    }>;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  }): UpdatePreferencesInput {
    return {
      userId: '',
      preferences: body.preferences?.map((p) => {
        const target = NotificationTargetMapper.fromApi(
          p.notificationType,
          p.channel,
        );
        return {
          notificationType: target.notificationType,
          channel: target.channel,
          enabled: p.enabled,
        };
      }),
      quietHours: body.quietHours,
    };
  }

  private hashRequest(input: UpdatePreferencesInput): string {
    return createHash('sha256').update(JSON.stringify(input)).digest('hex');
  }
}
