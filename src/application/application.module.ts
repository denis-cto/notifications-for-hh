import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { EvaluateService } from './evaluate.service';
import { AdminService } from './admin.service';
import { PersistenceModule } from '../infrastructure/persistence/prisma/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [PreferencesService, EvaluateService, AdminService],
  exports: [PreferencesService, EvaluateService, AdminService],
})
export class ApplicationModule {}
