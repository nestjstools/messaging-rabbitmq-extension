import { Injectable } from '@nestjs/common';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { AmqpChannel } from '../channel/amqp.channel';

@Injectable()
export class RabbitmqMigrator {
  private channelWrapper?: ChannelWrapper;

  async run(channel: AmqpChannel): Promise<void> {
    if (channel.config.autoCreate === false) {
      return Promise.resolve();
    }

    if (!channel.connection) {
      throw new Error('Brak aktywnego połączenia AMQP');
    }

    this.channelWrapper = channel.createChannelWrapper();

    await this.channelWrapper.addSetup(async (ch: Channel) => {
      // Exchange
      await ch.assertExchange(
        channel.config.exchangeName,
        channel.config.exchangeType,
        { durable: true },
      );

      // Queue
      await ch.assertQueue(channel.config.queue, {
        durable: true,
      });

      // Dead letter infra
      if (channel.config.deadLetterQueueFeature) {
        const dlxExchange = 'dead_letter.exchange';
        const dlq = `${channel.config.queue}_dead_letter`;
        await ch.assertExchange(dlxExchange, 'direct', { durable: true });
        await ch.assertQueue(dlq, { durable: true });
        await ch.bindQueue(dlq, dlxExchange, dlq);
      }

      // Bindings
      for (const key of channel.config.bindingKeys ?? []) {
        await ch.bindQueue(
          channel.config.queue,
          channel.config.exchangeName,
          key,
        );
      }
    });

    return await this.channelWrapper.waitForConnect();
  }
}
