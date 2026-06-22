import { QuietHours } from './quiet-hours';

describe('QuietHours', () => {
  const berlinQuietHours = QuietHours.create({
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Europe/Berlin',
  });

  describe('disabled', () => {
    it('uses UTC by default', () => {
      const qh = QuietHours.disabled();
      expect(qh.enabled).toBe(false);
      expect(qh.timezone).toBe('UTC');
    });

    it('accepts custom timezone', () => {
      const qh = QuietHours.disabled('America/New_York');
      expect(qh.timezone).toBe('America/New_York');
    });

    it('returns false for isWithin regardless of time', () => {
      const qh = QuietHours.disabled();
      expect(qh.isWithin(new Date('2026-05-21T23:00:00Z'))).toBe(false);
      expect(qh.isWithin(new Date('2026-05-21T03:00:00Z'))).toBe(false);
    });
  });

  describe('isWithin', () => {
    it('blocks during overnight quiet hours in user timezone', () => {
      // 21:30 UTC = 23:30 Berlin (CEST, UTC+2) -> within 22:00-08:00
      expect(berlinQuietHours.isWithin(new Date('2026-05-21T21:30:00Z'))).toBe(
        true,
      );
    });

    it('allows outside quiet hours', () => {
      // 10:00 UTC = 12:00 Berlin -> outside quiet hours
      expect(berlinQuietHours.isWithin(new Date('2026-05-21T10:00:00Z'))).toBe(
        false,
      );
    });

    it('handles same-day window (e.g. lunch break)', () => {
      const lunchBreak = QuietHours.create({
        enabled: true,
        start: '12:00',
        end: '13:00',
        timezone: 'UTC',
      });
      expect(lunchBreak.isWithin(new Date('2026-05-21T12:30:00Z'))).toBe(true);
      expect(lunchBreak.isWithin(new Date('2026-05-21T11:30:00Z'))).toBe(
        false,
      );
    });

    it('treats start as inclusive and end as exclusive for same-day window', () => {
      const window = QuietHours.create({
        enabled: true,
        start: '12:00',
        end: '13:00',
        timezone: 'UTC',
      });
      expect(window.isWithin(new Date('2026-05-21T12:00:00Z'))).toBe(true);
      expect(window.isWithin(new Date('2026-05-21T13:00:00Z'))).toBe(false);
    });

    it('returns true for entire day when start equals end', () => {
      const allDay = QuietHours.create({
        enabled: true,
        start: '00:00',
        end: '00:00',
        timezone: 'UTC',
      });
      expect(allDay.isWithin(new Date('2026-05-21T06:00:00Z'))).toBe(true);
      expect(allDay.isWithin(new Date('2026-05-21T18:00:00Z'))).toBe(true);
    });

    it('handles overnight window on both sides of midnight', () => {
      const overnight = QuietHours.create({
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC',
      });
      expect(overnight.isWithin(new Date('2026-05-21T23:00:00Z'))).toBe(true);
      expect(overnight.isWithin(new Date('2026-05-22T03:00:00Z'))).toBe(true);
      expect(overnight.isWithin(new Date('2026-05-21T12:00:00Z'))).toBe(false);
    });

    it('returns false for invalid Date', () => {
      expect(berlinQuietHours.isWithin(new Date('invalid'))).toBe(false);
    });
  });

  describe('create', () => {
    it('rejects invalid start time format', () => {
      expect(() =>
        QuietHours.create({
          enabled: true,
          start: '25:00',
          end: '08:00',
          timezone: 'UTC',
        }),
      ).toThrow('Invalid start time format');
    });

    it('rejects invalid end time format', () => {
      expect(() =>
        QuietHours.create({
          enabled: true,
          start: '22:00',
          end: '8:00',
          timezone: 'UTC',
        }),
      ).toThrow('Invalid end time format');
    });

    it('rejects invalid timezone', () => {
      expect(() =>
        QuietHours.create({
          enabled: true,
          start: '22:00',
          end: '08:00',
          timezone: 'Not/A/Timezone',
        }),
      ).toThrow('Invalid timezone');
    });

    it('skips validation when disabled', () => {
      expect(() =>
        QuietHours.create({
          enabled: false,
          start: '25:00',
          end: 'invalid',
          timezone: 'Not/A/Timezone',
        }),
      ).not.toThrow();
    });
  });

  describe('toConfig', () => {
    it('round-trips configuration', () => {
      const config = {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Europe/Berlin',
      };
      const qh = QuietHours.create(config);
      expect(qh.toConfig()).toEqual(config);
    });
  });
});
