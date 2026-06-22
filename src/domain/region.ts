import { Region } from './type';

export type { Region } from './type';

export class RegionMapper {
  static create(code: string): Region {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,10}$/.test(normalized)) {
      throw new Error(`Invalid region code: ${code}`);
    }
    return normalized as Region;
  }

  static toApi(region: Region): string {
    return region;
  }

  static fromApi(value: string): Region {
    return RegionMapper.create(value);
  }
}
