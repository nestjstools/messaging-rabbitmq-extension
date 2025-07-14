import { AmqpChannel } from './amqp.channel';
import { Injectable } from '@nestjs/common';
import {
  AmqpChannelConfig,
  ChannelFactory,
  IChannelFactory,
} from '@nestjstools/messaging';

/**
 * @deprecated Use `RmqChannelFactory`
 */
@Injectable()
@ChannelFactory(AmqpChannelConfig)
export class AmqpChannelFactory implements IChannelFactory<AmqpChannelConfig> {
  create(channelConfig: AmqpChannelConfig): AmqpChannel {
    return new AmqpChannel(channelConfig);
  }
}
