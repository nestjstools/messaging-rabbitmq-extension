import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { Channel } from '@nestjstools/messaging';
import { ConsumerMessage } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMigrator } from '../migrator/rabbitmq.migrator';

@Injectable()
@MessageConsumer(AmqpChannel)
export class RabbitmqMessagingConsumer implements IMessagingConsumer {
  constructor(
    private readonly rabbitMqMigrator: RabbitmqMigrator,
  ) {
  }

  async consume(dispatcher: ConsumerMessageDispatcher, channel: Channel): Promise<void> {
    if (!(channel instanceof AmqpChannel)) {
      throw new Error(`Only AmqpChannel is supported in ${RabbitmqMessagingConsumer.name}`);
    }

    await this.rabbitMqMigrator.run(channel);

    channel.connection.createConsumer({
      queue: channel.config.queue,
      queueOptions: { durable: true },
    }, async (msg): Promise<void> => {
      const rabbitMqMessage = msg as RabbitMQMessage;
        dispatcher.dispatch(new ConsumerMessage(rabbitMqMessage.body, rabbitMqMessage.headers[RABBITMQ_HEADER_ROUTING_KEY] ?? rabbitMqMessage.routingKey));
    });

    return Promise.resolve();
  }

  onError(errored: ConsumerDispatchedMessageError, channel: Channel): Promise<void> {
    return Promise.resolve();
  }
}

interface RabbitMQMessage {
  contentType: string;
  body: object;
  routingKey: string;
  headers: { [key: string]: string };
}
