import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  DefaultPreferenceRecord,
  DefaultPreferenceRepository,
  GLOBAL_POLICY_REPOSITORY,
  GlobalPolicyRepository,
} from './ports/repositories';
import { ChannelMapper } from '../domain/channel';
import { NotificationTypeMapper } from '../domain/notification-type';
import { NotificationTargetMapper } from '../domain/notification-target';
import { RegionMapper } from '../domain/region';

@Injectable()
export class AdminService {
  constructor(
    @Inject(GLOBAL_POLICY_REPOSITORY)
    private readonly globalPolicyRepo: GlobalPolicyRepository,
    @Inject(DEFAULT_PREFERENCE_REPOSITORY)
    private readonly defaultPreferenceRepo: DefaultPreferenceRepository,
  ) {}

  async listPolicies() {
    const policies = await this.globalPolicyRepo.findAll();
    return policies.map((policy) => this.toPolicyApi(policy));
  }

  async createPolicy(input: {
    notificationType?: string | null;
    channel?: string | null;
    region?: string | null;
    effect: 'DENY' | 'ALLOW';
    reason: string;
    enabled?: boolean;
  }) {
    const type = input.notificationType
      ? NotificationTypeMapper.fromApi(input.notificationType)
      : null;
    const channel = input.channel ? ChannelMapper.fromApi(input.channel) : null;
    const region = input.region ? RegionMapper.create(input.region) : null;

    const policy = await this.globalPolicyRepo.create({
      type,
      channel,
      region,
      effect: input.effect,
      reason: input.reason,
      enabled: input.enabled,
    });

    return this.toPolicyApi(policy);
  }

  async listDefaults() {
    const defaults = await this.defaultPreferenceRepo.findAll();
    return defaults.map((pref) => this.toDefaultApi(pref));
  }

  async updateDefaults(
    preferences: Array<{
      notificationType: string;
      channel?: string;
      enabled: boolean;
    }>,
  ) {
    const records: DefaultPreferenceRecord[] = preferences.map((pref) => {
      const target = NotificationTargetMapper.fromApi(
        pref.notificationType,
        pref.channel,
      );
      return {
        type: target.notificationType,
        channel: target.channel,
        enabled: pref.enabled,
      };
    });

    const updated = await this.defaultPreferenceRepo.upsertMany(records);
    return updated.map((pref) => this.toDefaultApi(pref));
  }

  private toPolicyApi(policy: {
    id: string;
    type: DefaultPreferenceRecord['type'] | null;
    channel: DefaultPreferenceRecord['channel'] | null;
    region: string | null;
    effect: 'DENY' | 'ALLOW';
    reason: string;
    enabled: boolean;
  }) {
    return {
      id: policy.id,
      notificationType: policy.type
        ? NotificationTypeMapper.toApi(policy.type)
        : null,
      channel: policy.channel ? ChannelMapper.toApi(policy.channel) : null,
      region: policy.region,
      effect: policy.effect,
      reason: policy.reason,
      enabled: policy.enabled,
    };
  }

  private toDefaultApi(pref: DefaultPreferenceRecord) {
    return {
      notificationType: NotificationTypeMapper.toApi(pref.type),
      channel: ChannelMapper.toApi(pref.channel),
      enabled: pref.enabled,
    };
  }
}
