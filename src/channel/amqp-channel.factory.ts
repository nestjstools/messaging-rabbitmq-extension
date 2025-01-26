import { Injectable } from '@nestjs/common';
import { Channel } from '@nestjstools/messaging/channel/channel';
import { IChannelFactory } from '@nestjstools/messaging/channel/i-channel-factory';
import { AmqpChannelConfig, ChannelConfig } from '@nestjstools/messaging/config';
import { AmqpChannel } from './amqp.channel';
import { ChannelFactory } from '@nestjstools/messaging/dependency-injection/decorator';

@Injectable()
@ChannelFactory(AmqpChannelConfig)
export class AmqpChannelFactory implements IChannelFactory {
  create(channelConfig: ChannelConfig): Channel {
    if (!(channelConfig instanceof AmqpChannelConfig)) {
      throw new Error('Channel config must be a AmqpChannelConfig');
    }

    return new AmqpChannel(channelConfig);
  }
}
