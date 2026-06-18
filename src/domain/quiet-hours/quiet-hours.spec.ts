import { QuietHours } from '../quiet-hours/quiet-hours';

describe('QuietHours', () => {
  const berlinQuietHours = QuietHours.create({
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Europe/Berlin',
  });

  it('returns false when disabled', () => {
    const qh = QuietHours.disabled();
    expect(qh.isWithin(new Date('2026-05-21T23:00:00Z'))).toBe(false);
  });

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
    expect(lunchBreak.isWithin(new Date('2026-05-21T11:30:00Z'))).toBe(false);
  });

  it('rejects invalid time format', () => {
    expect(() =>
      QuietHours.create({
        enabled: true,
        start: '25:00',
        end: '08:00',
        timezone: 'UTC',
      }),
    ).toThrow();
  });
});
