import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { ConsumerMessage } from '@nestjstools/messaging';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMigrator } from '../migrator/rabbitmq.migrator';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage, Options } from 'amqplib';

@Injectable()
@MessageConsumer(AmqpChannel)
export class RabbitmqMessagingConsumer
  implements IMessagingConsumer<AmqpChannel>, OnModuleDestroy
{
  private channel?: AmqpChannel = undefined;
  private amqpChannel: ChannelWrapper;

  constructor(private readonly rabbitMqMigrator: RabbitmqMigrator) {}

  async consume(
    dispatcher: ConsumerMessageDispatcher,
    channel: AmqpChannel,
  ): Promise<void> {
    this.channel = channel;
    await this.rabbitMqMigrator.run(channel);

    if (!channel.connection) {
      throw new Error('There is no active connection to RabbitMQ. Cannot consume messages.');
    }

    const channelWrapper = channel.createChannelWrapper();
    await channelWrapper.waitForConnect();
    this.amqpChannel = channelWrapper;

    await channelWrapper.addSetup(async (rawChannel: Channel) => {
      return rawChannel.consume(
        channel.config.queue,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          let payload: unknown = msg.content;
          if (Buffer.isBuffer(payload)) {
            try {
              payload = JSON.parse(payload.toString());
            } catch {
              rawChannel.nack(msg, false, false);
              return;
            }
          }

          const routingKey: string =
            (msg.properties.headers?.[RABBITMQ_HEADER_ROUTING_KEY] as
              | string
              | undefined) ?? msg.fields.routingKey;

          if (dispatcher.isReady()) {
            await dispatcher.dispatch(
              new ConsumerMessage(payload as object, routingKey),
            );
            rawChannel.ack(msg);
          } else {
            rawChannel.nack(msg, false, true);
          }
        },
        { noAck: false },
      );
    });
  }

  async onError(
    errored: ConsumerDispatchedMessageError,
    channel: AmqpChannel,
  ): Promise<void> {
    if (channel.config.deadLetterQueueFeature && this.amqpChannel) {
      const exchange = 'dead_letter.exchange';
      const routingKey = `${channel.config.queue}_dead_letter`;

      await this.amqpChannel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(errored.dispatchedConsumerMessage.message)),
        {
          headers: {
            [RABBITMQ_HEADER_ROUTING_KEY]:
              errored.dispatchedConsumerMessage.routingKey,
          },
        } as Options.Publish,
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
