import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { IMessagingConsumer } from '@nestjstools/messaging';
import { ConsumerMessageDispatcher } from '@nestjstools/messaging';
import { ConsumerMessage } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { MessageConsumer } from '@nestjstools/messaging';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMigrator } from '../migrator/rabbitmq.migrator';

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
      const routingKey =
        rabbitMqMessage.headers?.[RABBITMQ_HEADER_ROUTING_KEY] ?? rabbitMqMessage.routingKey;

        dispatcher.dispatch(new ConsumerMessage(rabbitMqMessage.body, routingKey));
    });

    return Promise.resolve();
  }

  onError(errored: ConsumerDispatchedMessageError, channel: AmqpChannel): Promise<void> {
    return Promise.resolve();
  }
}

interface RabbitMQMessage {
  contentType: string;
  body: object;
  routingKey: string;
  headers: { [key: string]: string };
}
