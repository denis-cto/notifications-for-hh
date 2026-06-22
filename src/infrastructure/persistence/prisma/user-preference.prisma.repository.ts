import { Injectable } from '@nestjs/common';
import {
  UserPreferenceRecord,
  UserPreferenceRepository,
  PreferenceUpdate,
} from '../../../application/ports/repositories';
import { PrismaService } from './prisma.service';
import { PrismaEnumMapper } from './enum.mapper';

@Injectable()
export class UserPreferencePrismaRepository
  implements UserPreferenceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferenceRecord[]> {
    const rows = await this.prisma.userPreference.findMany({
      where: { userId },
    });
    return rows.map((row) => ({
      type: PrismaEnumMapper.toDomainNotificationType(row.type),
      channel: PrismaEnumMapper.toDomainChannel(row.channel),
      enabled: row.enabled,
    }));
  }

  async upsertMany(
    userId: string,
    preferences: PreferenceUpdate[],
  ): Promise<UserPreferenceRecord[]> {
    const results: UserPreferenceRecord[] = [];

    for (const pref of preferences) {
      const row = await this.prisma.userPreference.upsert({
        where: {
          userId_type_channel: {
            userId,
            type: PrismaEnumMapper.toPrismaNotificationType(pref.notificationType),
            channel: PrismaEnumMapper.toPrismaChannel(pref.channel),
          },
        },
        create: {
          userId,
          type: PrismaEnumMapper.toPrismaNotificationType(pref.notificationType),
          channel: PrismaEnumMapper.toPrismaChannel(pref.channel),
          enabled: pref.enabled,
        },
        update: {
          enabled: pref.enabled,
        },
      });
      results.push({
        type: PrismaEnumMapper.toDomainNotificationType(row.type),
        channel: PrismaEnumMapper.toDomainChannel(row.channel),
        enabled: row.enabled,
      });
    }

    return results;
  }
}
