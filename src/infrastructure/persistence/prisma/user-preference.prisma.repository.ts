import { Injectable } from '@nestjs/common';
import {
  UserPreferenceRecord,
  UserPreferenceRepository,
  PreferenceUpdate,
} from '../../../application/ports/repositories';
import { PrismaService } from './prisma.service';
import {
  toDomainChannel,
  toDomainNotificationType,
  toPrismaChannel,
  toPrismaNotificationType,
} from './enum.mapper';

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
      type: toDomainNotificationType(row.type),
      channel: toDomainChannel(row.channel),
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
            type: toPrismaNotificationType(pref.notificationType),
            channel: toPrismaChannel(pref.channel),
          },
        },
        create: {
          userId,
          type: toPrismaNotificationType(pref.notificationType),
          channel: toPrismaChannel(pref.channel),
          enabled: pref.enabled,
        },
        update: {
          enabled: pref.enabled,
        },
      });
      results.push({
        type: toDomainNotificationType(row.type),
        channel: toDomainChannel(row.channel),
        enabled: row.enabled,
      });
    }

    return results;
  }
}
