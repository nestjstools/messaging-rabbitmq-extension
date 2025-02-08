import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { ConsumerMessage } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMigrator } from '../migrator/rabbitmq.migrator';
import { Buffer } from 'buffer';

@Injectable()
@MessageConsumer(AmqpChannel)
export class RabbitmqMessagingConsumer implements IMessagingConsumer<AmqpChannel> {
  constructor(
    private readonly rabbitMqMigrator: RabbitmqMigrator,
  ) {
  }

  async consume(dispatcher: ConsumerMessageDispatcher, channel: AmqpChannel): Promise<void> {
    await this.rabbitMqMigrator.run(channel);

    channel.connection.createConsumer({
      queue: channel.config.queue,
      queueOptions: { durable: true },
    }, async (msg): Promise<void> => {
      const rabbitMqMessage = msg as RabbitMQMessage;

      let message = rabbitMqMessage.body;
      if (Buffer.isBuffer(message)) {
        const messageContent = message.toString();
        message = JSON.parse(messageContent);
      }

      const routingKey =
        rabbitMqMessage.headers?.[RABBITMQ_HEADER_ROUTING_KEY] ?? rabbitMqMessage.routingKey;

        dispatcher.dispatch(new ConsumerMessage(message, routingKey));
    });

    return Promise.resolve();
  }

  onError(errored: ConsumerDispatchedMessageError, channel: AmqpChannel): Promise<void> {
    if (channel.config.deadLetterQueueFeature) {
      const publisher = channel.connection.createPublisher();
      const envelope = {
        headers: { 'messaging-routing-key': errored.dispatchedConsumerMessage.routingKey },
        exchange: 'dead_letter.exchange',
        routingKey: `${channel.config.queue}_dead_letter`
      };
      publisher.send(envelope, errored.dispatchedConsumerMessage.message);
    }

    return Promise.resolve();
  }
}

interface RabbitMQMessage {
  contentType: string;
  body: object;
  routingKey: string;
  headers: { [key: string]: string };
}
