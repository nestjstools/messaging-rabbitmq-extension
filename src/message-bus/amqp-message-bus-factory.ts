import { Injectable } from '@nestjs/common';
import { AmqpMessageBus } from './amqp-message.bus';
import { AmqpChannel } from '../channel/amqp.channel';
import {IMessageBusFactory} from "@nestjstools/messaging/bus/i-message-bus.factory";
import {MessageBusFactory} from "@nestjstools/messaging/dependency-injection/decorator";
import {IMessageBus} from "@nestjstools/messaging/bus/i-message-bus";
import {Channel} from "@nestjstools/messaging/channel/channel";

@Injectable()
@MessageBusFactory(AmqpChannel)
export class AmqpMessageBusFactory implements IMessageBusFactory {

  create(channel: Channel): IMessageBus {
    if (!(channel instanceof AmqpChannel)) {
      throw new Error(`Cannot create a message bus for given channel ${channel}`);
    }

    return new AmqpMessageBus(channel);
  }
}
