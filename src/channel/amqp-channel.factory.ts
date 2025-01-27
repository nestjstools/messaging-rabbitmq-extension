import { AmqpChannel } from './amqp.channel';
import {Injectable} from "@nestjs/common";
import {AmqpChannelConfig, ChannelConfig, ChannelFactory, IChannelFactory} from "@nestjstools/messaging";
import {Channel} from "@nestjstools/messaging";

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
