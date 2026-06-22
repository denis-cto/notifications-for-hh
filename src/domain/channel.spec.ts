import { Channel } from './type';
import { ChannelMapper } from './channel';

describe('ChannelMapper', () => {
  describe('parse', () => {
    it.each([
      ['EMAIL', Channel.EMAIL],
      ['email', Channel.EMAIL],
      ['SMS', Channel.SMS],
      ['sms', Channel.SMS],
      ['PUSH', Channel.PUSH],
      ['push', Channel.PUSH],
      ['MESSENGER', Channel.MESSENGER],
      ['messenger', Channel.MESSENGER],
    ])('parses %s to %s', (input, expected) => {
      expect(ChannelMapper.parse(input)).toBe(expected);
    });

    it.each(['invalid', '', 'TELEGRAM'])(
      'throws for invalid value %s',
      (input) => {
        expect(() => ChannelMapper.parse(input)).toThrow(
          `Invalid channel: ${input}`,
        );
      },
    );
  });

  describe('toApi', () => {
    it('lowercases channel', () => {
      expect(ChannelMapper.toApi(Channel.EMAIL)).toBe('email');
      expect(ChannelMapper.toApi(Channel.SMS)).toBe('sms');
      expect(ChannelMapper.toApi(Channel.PUSH)).toBe('push');
      expect(ChannelMapper.toApi(Channel.MESSENGER)).toBe('messenger');
    });
  });

  describe('fromApi', () => {
    it('round-trips via toApi', () => {
      for (const channel of Object.values(Channel)) {
        expect(ChannelMapper.fromApi(ChannelMapper.toApi(channel))).toBe(
          channel,
        );
      }
    });

    it('throws for invalid API value', () => {
      expect(() => ChannelMapper.fromApi('invalid')).toThrow();
    });
  });
});
