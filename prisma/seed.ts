import {
  Channel,
  NotificationType,
  PolicyEffect,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const defaultPreferences: Array<{
  type: NotificationType;
  channel: Channel;
  enabled: boolean;
}> = [
  { type: NotificationType.TRANSACTIONAL, channel: Channel.EMAIL, enabled: true },
  { type: NotificationType.TRANSACTIONAL, channel: Channel.SMS, enabled: true },
  { type: NotificationType.TRANSACTIONAL, channel: Channel.PUSH, enabled: true },
  { type: NotificationType.TRANSACTIONAL, channel: Channel.MESSENGER, enabled: true },
  { type: NotificationType.MARKETING, channel: Channel.EMAIL, enabled: false },
  { type: NotificationType.MARKETING, channel: Channel.SMS, enabled: false },
  { type: NotificationType.MARKETING, channel: Channel.PUSH, enabled: false },
  { type: NotificationType.MARKETING, channel: Channel.MESSENGER, enabled: false },
  { type: NotificationType.SECURITY, channel: Channel.EMAIL, enabled: true },
  { type: NotificationType.SECURITY, channel: Channel.SMS, enabled: true },
  { type: NotificationType.SECURITY, channel: Channel.PUSH, enabled: true },
  { type: NotificationType.SECURITY, channel: Channel.MESSENGER, enabled: true },
];

async function main() {
  for (const pref of defaultPreferences) {
    await prisma.defaultPreference.upsert({
      where: {
        type_channel: { type: pref.type, channel: pref.channel },
      },
      create: pref,
      update: { enabled: pref.enabled },
    });
  }

  const existingPolicy = await prisma.globalPolicy.findFirst({
    where: {
      type: NotificationType.MARKETING,
      channel: Channel.SMS,
      region: 'EU',
    },
  });

  if (!existingPolicy) {
    await prisma.globalPolicy.create({
      data: {
        type: NotificationType.MARKETING,
        channel: Channel.SMS,
        region: 'EU',
        effect: PolicyEffect.DENY,
        reason: 'blocked_by_global_policy',
        enabled: true,
      },
    });
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
