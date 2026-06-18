import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { EvaluateController } from './evaluate.controller';
import { HealthController } from './health.controller';
import { PreferencesController } from './preferences.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [PreferencesController, EvaluateController, HealthController],
})
export class HttpModule {}
