import { AmqpChannel } from '../channel/amqp.channel';
import {Injectable} from "@nestjs/common";
import {ExchangeType} from "@nestjstools/messaging";

@Injectable()
export class RabbitmqMigrator {
  async run(channel: AmqpChannel): Promise<any> {
    if (false === channel.config.autoCreate) {
      return;
    }

    await channel.connection.exchangeDeclare({
      durable: true,
      exchange: channel.config.exchangeName,
      type: channel.config.exchangeType,
    });

    if (channel.config.deadLetterQueueFeature) {
      await channel.connection.exchangeDeclare({
        durable: true,
        exchange: 'dead_letter.exchange',
        type: ExchangeType.DIRECT,
      });
    }

    await channel.connection.queueDeclare({ durable: true, queue: channel.config.queue });

    if (channel.config.deadLetterQueueFeature) {
      await channel.connection.queueDeclare({ durable: true, queue: `${channel.config.queue}_dead_letter` });
      await channel.connection.queueBind({
        queue: `${channel.config.queue}_dead_letter`,
        exchange: 'dead_letter.exchange',
        routingKey: `${channel.config.queue}_dead_letter`,
      });
    }

    for (const bindingKey of channel.config.bindingKeys) {
      await channel.connection.queueBind({
        queue: channel.config.queue,
        exchange: channel.config.exchangeName,
        routingKey: bindingKey,
      });
    }
  }
}
