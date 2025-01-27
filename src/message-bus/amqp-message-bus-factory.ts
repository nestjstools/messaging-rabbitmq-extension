import { Injectable } from '@nestjs/common';
import { AmqpMessageBus } from './amqp-message.bus';
import { AmqpChannel } from '../channel/amqp.channel';
import {IMessageBusFactory} from "@nestjstools/messaging";
import {MessageBusFactory} from "@nestjstools/messaging";
import {IMessageBus} from "@nestjstools/messaging";
import {Channel} from "@nestjstools/messaging";

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
