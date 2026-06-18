import { Injectable } from '@nestjs/common';
import {
  DefaultPreferenceRecord,
  DefaultPreferenceRepository,
} from '../../../application/ports/repositories';
import { PrismaService } from './prisma.service';
import { toDomainChannel, toDomainNotificationType } from './enum.mapper';

@Injectable()
export class DefaultPreferencePrismaRepository
  implements DefaultPreferenceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DefaultPreferenceRecord[]> {
    const rows = await this.prisma.defaultPreference.findMany();
    return rows.map((row) => ({
      type: toDomainNotificationType(row.type),
      channel: toDomainChannel(row.channel),
      enabled: row.enabled,
    }));
  }
}
