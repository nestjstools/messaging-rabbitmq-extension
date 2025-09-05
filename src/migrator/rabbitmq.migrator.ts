import { AmqpChannel } from '../channel/amqp.channel';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitmqMigrator {
  async run(channel: AmqpChannel): Promise<void> {
    if (channel.config.autoCreate === false) {
      return;
    }

    if (!channel.channel) {
      throw new Error('AMQP channel not initialized. Did you call init()?');
    }

    await channel.channel.assertExchange(
      channel.config.exchangeName,
      channel.config.exchangeType,
      { durable: true },
    );

    await channel.channel.assertQueue(channel.config.queue, {
      durable: true,
    });

    if (channel.config.deadLetterQueueFeature === true) {
      const dlxExchange = 'dead_letter.exchange';
      const dlq = `${channel.config.queue}_dead_letter`;

      await channel.channel.assertExchange(dlxExchange, 'direct', {
        durable: true,
      });

      await channel.channel.assertQueue(dlq, { durable: true });

      await channel.channel.bindQueue(dlq, dlxExchange, dlq);
    }

    // Bindings
    for (const bindingKey of channel.config.bindingKeys ?? []) {
      await channel.channel.bindQueue(
        channel.config.queue,
        channel.config.exchangeName,
        bindingKey,
      );
    }
  }
}
