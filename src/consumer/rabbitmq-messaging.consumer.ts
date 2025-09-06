import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { ConsumerMessage } from '@nestjstools/messaging';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMigrator } from '../migrator/rabbitmq.migrator';
import { Buffer } from 'buffer';

@Injectable()
@MessageConsumer(AmqpChannel)
export class RabbitmqMessagingConsumer
  implements IMessagingConsumer<AmqpChannel>, OnModuleDestroy
{
  private channel?: AmqpChannel = undefined;

  constructor(private readonly rabbitMqMigrator: RabbitmqMigrator) {}

  async consume(
    dispatcher: ConsumerMessageDispatcher,
    channel: AmqpChannel,
  ): Promise<void> {
    await channel.init();
    this.channel = channel;
    await this.rabbitMqMigrator.run(channel);

    const amqpChannel = channel.channel;
    if (!amqpChannel) {
      throw new Error('AMQP channel not initialized');
    }

    await amqpChannel.consume(
      channel.config.queue,
      async (msg) => {
        if (!msg) return;

        let message: any = msg.content;
        if (Buffer.isBuffer(message)) {
          message = JSON.parse(message.toString());
        }

        const routingKey =
          msg.properties.headers?.[RABBITMQ_HEADER_ROUTING_KEY] ??
          msg.fields.routingKey;

        await dispatcher.dispatch(new ConsumerMessage(message, routingKey));

        amqpChannel.ack(msg);
      },
      { noAck: false },
    );
  }

  async onError(
    errored: ConsumerDispatchedMessageError,
    channel: AmqpChannel,
  ): Promise<void> {
    if (channel.config.deadLetterQueueFeature && channel.channel) {
      const exchange = 'dead_letter.exchange';
      const routingKey = `${channel.config.queue}_dead_letter`;

      await channel.channel.assertExchange(exchange, 'direct', {
        durable: true,
      });

      channel.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(errored.dispatchedConsumerMessage.message)),
        {
          headers: {
            'messaging-routing-key':
              errored.dispatchedConsumerMessage.routingKey,
          },
        },
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel?.connection) {
      await this.channel.connection.close();
    }
    this.channel = undefined;
  }
}

interface RabbitMQMessage {
  contentType: string;
  body: object;
  routingKey: string;
  headers: { [key: string]: string };
}
