import { Injectable } from '@nestjs/common';
import {
  DefaultPreferenceRecord,
  DefaultPreferenceRepository,
} from '../../../application/ports/repositories';
import { PrismaService } from './prisma.service';
import { PrismaEnumMapper } from './enum.mapper';

@Injectable()
export class DefaultPreferencePrismaRepository
  implements DefaultPreferenceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DefaultPreferenceRecord[]> {
    const rows = await this.prisma.defaultPreference.findMany();
    return rows.map((row) => this.toRecord(row));
  }

  async upsertMany(
    preferences: DefaultPreferenceRecord[],
  ): Promise<DefaultPreferenceRecord[]> {
    const results: DefaultPreferenceRecord[] = [];
    for (const pref of preferences) {
      const row = await this.prisma.defaultPreference.upsert({
        where: {
          type_channel: {
            type: PrismaEnumMapper.toPrismaNotificationType(pref.type),
            channel: PrismaEnumMapper.toPrismaChannel(pref.channel),
          },
        },
        create: {
          type: PrismaEnumMapper.toPrismaNotificationType(pref.type),
          channel: PrismaEnumMapper.toPrismaChannel(pref.channel),
          enabled: pref.enabled,
        },
        update: { enabled: pref.enabled },
      });
      results.push(this.toRecord(row));
    }
    return results;
  }

  private toRecord(row: {
    type: Parameters<typeof PrismaEnumMapper.toDomainNotificationType>[0];
    channel: Parameters<typeof PrismaEnumMapper.toDomainChannel>[0];
    enabled: boolean;
  }): DefaultPreferenceRecord {
    return {
      type: PrismaEnumMapper.toDomainNotificationType(row.type),
      channel: PrismaEnumMapper.toDomainChannel(row.channel),
      enabled: row.enabled,
    };
  }
}
