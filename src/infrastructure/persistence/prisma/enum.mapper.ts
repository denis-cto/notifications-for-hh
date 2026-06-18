import { Channel as DomainChannel } from '../../../domain/channel';
import { NotificationType as DomainNotificationType } from '../../../domain/notification-type';
import {
  Channel as PrismaChannel,
  NotificationType as PrismaNotificationType,
} from '@prisma/client';

export function toDomainNotificationType(
  value: PrismaNotificationType,
): DomainNotificationType {
  return value as unknown as DomainNotificationType;
}

export function toDomainChannel(value: PrismaChannel): DomainChannel {
  return value as unknown as DomainChannel;
}

export function toPrismaNotificationType(
  value: DomainNotificationType,
): PrismaNotificationType {
  return value as unknown as PrismaNotificationType;
}

export function toPrismaChannel(value: DomainChannel): PrismaChannel {
  return value as unknown as PrismaChannel;
}
