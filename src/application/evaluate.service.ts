import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GLOBAL_POLICY_REPOSITORY,
  GlobalPolicyRepository,
  METRICS_RECORDER,
  MetricsRecorder,
} from './ports/repositories';
import { PreferencesService } from './preferences.service';
import { PreferenceEvaluator } from '../domain/evaluation/preference-evaluator';
import { ChannelMapper } from '../domain/channel';
import { NotificationTargetMapper } from '../domain/notification-target';
import { RegionMapper } from '../domain/region';
import { QuietHours } from '../domain/quiet-hours/quiet-hours';
import { EvaluateInput, EvaluateOutput } from './type';

export type { EvaluateInput, EvaluateOutput } from './type';

@Injectable()
export class EvaluateService {
  private readonly logger = new Logger(EvaluateService.name);
  private readonly evaluator = new PreferenceEvaluator();

  constructor(
    private readonly preferencesService: PreferencesService,
    @Inject(GLOBAL_POLICY_REPOSITORY)
    private readonly globalPolicyRepo: GlobalPolicyRepository,
    @Inject(METRICS_RECORDER)
    private readonly metrics: MetricsRecorder,
  ) {}

  async evaluate(input: EvaluateInput): Promise<EvaluateOutput> {
    const start = Date.now();

    const { notificationType, channel } = NotificationTargetMapper.fromApi(
      input.notificationType,
      input.channel,
    );
    const region = RegionMapper.create(input.region);
    const datetime = new Date(input.datetime);

    const [preferenceSet, globalPolicies] = await Promise.all([
      this.preferencesService.buildPreferenceSet(input.userId),
      this.globalPolicyRepo.findAllEnabled(),
    ]);

    const quietHours = QuietHours.create(preferenceSet.quietHours);

    const decision = this.evaluator.evaluate({
      userId: input.userId,
      notificationType,
      channel,
      region,
      datetime,
      preferences: preferenceSet.preferences,
      quietHours,
      globalPolicies,
    });

    const durationMs = Date.now() - start;
    this.metrics.incrementDecision(decision.decision, decision.reason);
    this.metrics.observeEvaluateDuration(durationMs);

    this.logger.log({
      event: 'notification_decision',
      userId: input.userId,
      notificationType,
      channel,
      region: input.region,
      decision: decision.decision,
      reason: decision.reason,
      durationMs,
    });

    return {
      decision: decision.decision,
      reason: decision.reason,
      explanation: decision.explanation,
    };
  }
}
