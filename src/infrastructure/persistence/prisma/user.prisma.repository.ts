import { Injectable } from '@nestjs/common';
import {
  GlobalPolicyRecord,
  GlobalPolicyRepository,
  UserRecord,
  UserRepository,
} from '../../../application/ports/repositories';
import { QuietHoursConfig } from '../../../domain/quiet-hours/quiet-hours';
import { PrismaService } from './prisma.service';
import { toDomainChannel, toDomainNotificationType } from './enum.mapper';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    return this.toRecord(user);
  }

  async upsert(userId: string, quietHours?: QuietHoursConfig): Promise<UserRecord> {
    const user = await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        quietHoursEnabled: quietHours?.enabled ?? false,
        quietHoursStart: quietHours?.start ?? null,
        quietHoursEnd: quietHours?.end ?? null,
        timezone: quietHours?.timezone ?? 'UTC',
      },
      update: quietHours
        ? {
            quietHoursEnabled: quietHours.enabled,
            quietHoursStart: quietHours.start,
            quietHoursEnd: quietHours.end,
            timezone: quietHours.timezone,
          }
        : {},
    });
    return this.toRecord(user);
  }

  private toRecord(user: {
    id: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    timezone: string;
  }): UserRecord {
    return {
      id: user.id,
      quietHoursEnabled: user.quietHoursEnabled,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
      timezone: user.timezone,
    };
  }
}

@Injectable()
export class GlobalPolicyPrismaRepository implements GlobalPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllEnabled(): Promise<GlobalPolicyRecord[]> {
    const rows = await this.prisma.globalPolicy.findMany({
      where: { enabled: true },
    });
    return rows.map((row) => ({
      type: row.type ? toDomainNotificationType(row.type) : null,
      channel: row.channel ? toDomainChannel(row.channel) : null,
      region: row.region,
      effect: row.effect as 'DENY' | 'ALLOW',
      reason: row.reason,
      enabled: row.enabled,
    }));
  }
}

@Injectable()
export class IdempotencyPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string): Promise<{ requestHash: string } | null> {
    const row = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    return row ? { requestHash: row.requestHash } : null;
  }

  async save(key: string, scope: string, requestHash: string): Promise<void> {
    await this.prisma.idempotencyKey.upsert({
      where: { key },
      create: { key, scope, requestHash },
      update: { requestHash },
    });
  }
}
