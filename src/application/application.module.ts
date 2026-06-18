import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { EvaluateService } from './evaluate.service';
import { PersistenceModule } from '../infrastructure/persistence/prisma/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [PreferencesService, EvaluateService],
  exports: [PreferencesService, EvaluateService],
})
export class ApplicationModule {}
