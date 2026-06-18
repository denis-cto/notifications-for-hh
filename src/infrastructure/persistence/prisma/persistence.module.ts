import { Module } from '@nestjs/common';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  GLOBAL_POLICY_REPOSITORY,
  IDEMPOTENCY_REPOSITORY,
  METRICS_RECORDER,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../application/ports/repositories';
import { NoOpMetricsRecorder } from '../../observability/noop-metrics.recorder';
import { DefaultPreferencePrismaRepository } from './default-preference.prisma.repository';
import { PrismaService } from './prisma.service';
import {
  GlobalPolicyPrismaRepository,
  IdempotencyPrismaRepository,
  UserPrismaRepository,
} from './user.prisma.repository';
import { UserPreferencePrismaRepository } from './user-preference.prisma.repository';

@Module({
  providers: [
    PrismaService,
    {
      provide: DEFAULT_PREFERENCE_REPOSITORY,
      useClass: DefaultPreferencePrismaRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
    {
      provide: USER_PREFERENCE_REPOSITORY,
      useClass: UserPreferencePrismaRepository,
    },
    {
      provide: GLOBAL_POLICY_REPOSITORY,
      useClass: GlobalPolicyPrismaRepository,
    },
    {
      provide: IDEMPOTENCY_REPOSITORY,
      useClass: IdempotencyPrismaRepository,
    },
    {
      provide: METRICS_RECORDER,
      useClass: NoOpMetricsRecorder,
    },
  ],
  exports: [
    PrismaService,
    DEFAULT_PREFERENCE_REPOSITORY,
    USER_REPOSITORY,
    USER_PREFERENCE_REPOSITORY,
    GLOBAL_POLICY_REPOSITORY,
    IDEMPOTENCY_REPOSITORY,
    METRICS_RECORDER,
  ],
})
export class PersistenceModule {}
