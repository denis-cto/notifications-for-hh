import { DateTime } from 'luxon';
import { QuietHoursConfig } from './type';

export type { QuietHoursConfig } from './type';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class QuietHours {
  readonly enabled: boolean;
  readonly start: string;
  readonly end: string;
  readonly timezone: string;

  private constructor(config: QuietHoursConfig) {
    this.enabled = config.enabled;
    this.start = config.start;
    this.end = config.end;
    this.timezone = config.timezone;
  }

  static create(config: QuietHoursConfig): QuietHours {
    if (config.enabled) {
      QuietHours.validateTime(config.start, 'start');
      QuietHours.validateTime(config.end, 'end');
      if (!DateTime.now().setZone(config.timezone).isValid) {
        throw new Error(`Invalid timezone: ${config.timezone}`);
      }
    }
    return new QuietHours(config);
  }

  static disabled(timezone = 'UTC'): QuietHours {
    return new QuietHours({
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone,
    });
  }

  private static validateTime(value: string, field: string): void {
    if (!TIME_PATTERN.test(value)) {
      throw new Error(`Invalid ${field} time format: ${value}. Expected HH:mm`);
    }
  }

  isWithin(datetimeUtc: Date): boolean {
    if (!this.enabled) {
      return false;
    }

    const local = DateTime.fromJSDate(datetimeUtc, { zone: 'utc' }).setZone(
      this.timezone,
    );
    if (!local.isValid) {
      return false;
    }

    const currentMinutes = local.hour * 60 + local.minute;
    const [startH, startM] = this.start.split(':').map(Number);
    const [endH, endM] = this.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes === endMinutes) {
      return true;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  toConfig(): QuietHoursConfig {
    return {
      enabled: this.enabled,
      start: this.start,
      end: this.end,
      timezone: this.timezone,
    };
  }
}
