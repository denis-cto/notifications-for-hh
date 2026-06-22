import { Channel } from './type';

export { Channel } from './type';

export class ChannelMapper {
  static parse(value: string): Channel {
    const normalized = value.toUpperCase();
    if (!Object.values(Channel).includes(normalized as Channel)) {
      throw new Error(`Invalid channel: ${value}`);
    }
    return normalized as Channel;
  }

  static toApi(channel: Channel): string {
    return channel.toLowerCase();
  }

  static fromApi(value: string): Channel {
    return ChannelMapper.parse(value);
  }
}
