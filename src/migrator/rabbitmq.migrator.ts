import { AmqpChannel } from '../channel/amqp.channel';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitmqMigrator {
  async run(channel: AmqpChannel): Promise<void> {
    if (channel.config.autoCreate === false) {
      return;
    }

    const amqpChannel = await channel.connection.createChannel();

    await amqpChannel.assertExchange(
      channel.config.exchangeName,
      channel.config.exchangeType,
      { durable: true },
    );

    await amqpChannel.assertQueue(channel.config.queue, {
      durable: true,
    });

    if (channel.config.deadLetterQueueFeature === true) {
      const dlxExchange = 'dead_letter.exchange';
      const dlq = `${channel.config.queue}_dead_letter`;

      await amqpChannel.assertExchange(dlxExchange, 'direct', {
        durable: true,
      });

      await amqpChannel.assertQueue(dlq, { durable: true });

      await amqpChannel.bindQueue(dlq, dlxExchange, dlq);
    }

    // Bindings
    for (const bindingKey of channel.config.bindingKeys ?? []) {
      await amqpChannel.bindQueue(
        channel.config.queue,
        channel.config.exchangeName,
        bindingKey,
      );
    }
  }
}
