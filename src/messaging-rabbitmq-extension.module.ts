import { Global, Module } from '@nestjs/common';
import { AmqpMessageBusFactory } from './message-bus/amqp-message-bus-factory';
import { AmqpChannelFactory } from './channel/amqp-channel.factory';
import { RabbitmqMessagingConsumer } from './consumer/rabbitmq-messaging.consumer';
import { RabbitmqMigrator } from './migrator/rabbitmq.migrator';

@Global()
@Module({
  providers: [
    RabbitmqMigrator,
    AmqpMessageBusFactory,
    AmqpChannelFactory,
    RabbitmqMessagingConsumer,
  ],
})
export class MessagingRabbitmqExtensionModule {}
