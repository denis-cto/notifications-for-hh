import { RegionMapper } from './region';

describe('RegionMapper', () => {
  describe('create', () => {
    it('normalizes code by trimming and uppercasing', () => {
      expect(RegionMapper.create(' eu ')).toBe('EU');
      expect(RegionMapper.create('us-east')).toBe('US-EAST');
    });

    it('accepts alphanumeric, underscore, and hyphen', () => {
      expect(RegionMapper.create('EU')).toBe('EU');
      expect(RegionMapper.create('US_EAST')).toBe('US_EAST');
      expect(RegionMapper.create('RU-MSK')).toBe('RU-MSK');
    });

    it('accepts boundary lengths 2 and 10', () => {
      expect(RegionMapper.create('EU')).toBe('EU');
      expect(RegionMapper.create('ABCDEFGHIJ')).toBe('ABCDEFGHIJ');
    });

    it.each(['E', 'ABCDEFGHIJK'])(
      'throws for invalid length %s',
      (input) => {
        expect(() => RegionMapper.create(input)).toThrow(
          `Invalid region code: ${input}`,
        );
      },
    );

    it.each(['E U', 'eu!', ''])('throws for invalid characters %s', (input) => {
      expect(() => RegionMapper.create(input)).toThrow(
        `Invalid region code: ${input}`,
      );
    });
  });

  describe('toApi', () => {
    it('returns region unchanged', () => {
      const region = RegionMapper.create('EU');
      expect(RegionMapper.toApi(region)).toBe('EU');
    });
  });

  describe('fromApi', () => {
    it('round-trips via toApi', () => {
      const region = RegionMapper.create('eu');
      expect(RegionMapper.fromApi(RegionMapper.toApi(region))).toBe('EU');
    });

    it('throws for invalid API value', () => {
      expect(() => RegionMapper.fromApi('!')).toThrow();
    });
  });
});
