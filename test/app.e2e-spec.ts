import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as request from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

describe('Notification Preferences (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('notification_preferences')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();

    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
      stdio: 'inherit',
    });
    execSync('npx ts-node prisma/seed.ts', {
      env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  }, 180000);

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  it('GET /health returns ok', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
    });
  });

  describe('Scenario 1: New user and defaults', () => {
    it('returns default preferences for a new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/new-user-1/preferences')
        .expect(200);

      const transactionalEmail = response.body.preferences.find(
        (p: { notificationType: string; channel: string }) =>
          p.notificationType === 'transactional' && p.channel === 'email',
      );
      const marketingEmail = response.body.preferences.find(
        (p: { notificationType: string; channel: string }) =>
          p.notificationType === 'marketing' && p.channel === 'email',
      );

      expect(transactionalEmail.enabled).toBe(true);
      expect(transactionalEmail.source).toBe('default');
      expect(marketingEmail.enabled).toBe(false);
      expect(marketingEmail.source).toBe('default');
    });
  });

  describe('Scenario 2: User changes preferences', () => {
    const userId = 'user-scenario-2';

    it('allows disabling marketing email while transactional stays enabled', async () => {
      await request(app.getHttpServer())
        .post(`/users/${userId}/preferences`)
        .send({
          preferences: [
            {
              notificationType: 'marketing',
              channel: 'email',
              enabled: false,
            },
          ],
        })
        .expect(200);

      const prefs = await request(app.getHttpServer())
        .get(`/users/${userId}/preferences`)
        .expect(200);

      const marketingEmail = prefs.body.preferences.find(
        (p: { notificationType: string; channel: string }) =>
          p.notificationType === 'marketing' && p.channel === 'email',
      );
      expect(marketingEmail.enabled).toBe(false);
      expect(marketingEmail.source).toBe('user');

      const evaluateTransactional = await request(app.getHttpServer())
        .post('/evaluate')
        .send({
          userId,
          notificationType: 'transactional',
          channel: 'email',
          region: 'EU',
          datetime: '2026-05-21T10:00:00Z',
        })
        .expect(200);

      expect(evaluateTransactional.body.decision).toBe('allow');
    });
  });

  describe('Scenario 3: Quiet hours', () => {
    const userId = 'user-scenario-3';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post(`/users/${userId}/preferences`)
        .send({
          preferences: [
            {
              notificationType: 'marketing',
              channel: 'push',
              enabled: true,
            },
          ],
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            timezone: 'Europe/Berlin',
          },
        });
    });

    it('blocks marketing push during quiet hours', async () => {
      const response = await request(app.getHttpServer())
        .post('/evaluate')
        .send({
          userId,
          notificationType: 'marketing',
          channel: 'push',
          region: 'EU',
          datetime: '2026-05-21T21:30:00Z',
        })
        .expect(200);

      expect(response.body.decision).toBe('deny');
      expect(response.body.reason).toBe('blocked_by_quiet_hours');
    });

    it('allows transactional during quiet hours', async () => {
      const response = await request(app.getHttpServer())
        .post('/evaluate')
        .send({
          userId,
          notificationType: 'transactional',
          channel: 'email',
          region: 'EU',
          datetime: '2026-05-21T21:30:00Z',
        })
        .expect(200);

      expect(response.body.decision).toBe('allow');
    });
  });

  describe('Scenario 4: Global policies', () => {
    it('denies marketing SMS in EU region', async () => {
      const response = await request(app.getHttpServer())
        .post('/evaluate')
        .send({
          userId: 'any-user',
          notificationType: 'marketing',
          channel: 'sms',
          region: 'EU',
          datetime: '2026-05-21T10:00:00Z',
        })
        .expect(200);

      expect(response.body.decision).toBe('deny');
      expect(response.body.reason).toBe('blocked_by_global_policy');
    });
  });

  describe('Scenario 5: Idempotency', () => {
    const userId = 'user-scenario-5';

    it('applying the same disable twice yields stable state', async () => {
      const payload = {
        preferences: [
          {
            notificationType: 'marketing',
            channel: 'email',
            enabled: false,
          },
        ],
      };

      const first = await request(app.getHttpServer())
        .post(`/users/${userId}/preferences`)
        .send(payload)
        .expect(200);

      const second = await request(app.getHttpServer())
        .post(`/users/${userId}/preferences`)
        .send(payload)
        .expect(200);

      expect(second.body).toEqual(first.body);

      const dbCount = await prisma.userPreference.count({
        where: { userId },
      });
      expect(dbCount).toBe(1);
    });

    it('supports Idempotency-Key header', async () => {
      const userId2 = 'user-scenario-5b';
      const payload = {
        preferences: [
          {
            notificationType: 'marketing',
            channel: 'push',
            enabled: false,
          },
        ],
      };

      const key = 'idem-key-123';
      const first = await request(app.getHttpServer())
        .post(`/users/${userId2}/preferences`)
        .set('Idempotency-Key', key)
        .send(payload)
        .expect(200);

      const second = await request(app.getHttpServer())
        .post(`/users/${userId2}/preferences`)
        .set('Idempotency-Key', key)
        .send(payload)
        .expect(200);

      expect(second.body).toEqual(first.body);
    });
  });
});
