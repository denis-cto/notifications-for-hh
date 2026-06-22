import {
  Channel as DomainChannel,
  NotificationType as DomainNotificationType,
} from '../../../domain/type';
import {
  Channel as PrismaChannel,
  NotificationType as PrismaNotificationType,
} from '@prisma/client';

export class PrismaEnumMapper {
  static toDomainNotificationType(
    value: PrismaNotificationType,
  ): DomainNotificationType {
    return value as unknown as DomainNotificationType;
  }

  static toDomainChannel(value: PrismaChannel): DomainChannel {
    return value as unknown as DomainChannel;
  }

  static toPrismaNotificationType(
    value: DomainNotificationType,
  ): PrismaNotificationType {
    return value as unknown as PrismaNotificationType;
  }

  static toPrismaChannel(value: DomainChannel): PrismaChannel {
    return value as unknown as PrismaChannel;
  }
}
