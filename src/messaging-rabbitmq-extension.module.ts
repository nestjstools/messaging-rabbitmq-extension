import { Global, Module } from '@nestjs/common';
import { AmqpMessageBusFactory } from './message-bus/amqp-message-bus-factory';
import { RabbitmqMessagingConsumer } from './consumer/rabbitmq-messaging.consumer';
import { RabbitmqMigrator } from './migrator/rabbitmq.migrator';
import { RmqChannelFactory } from './channel/rmq-channel-factory';

@Global()
@Module({
  providers: [
    RabbitmqMigrator,
    AmqpMessageBusFactory,
    RmqChannelFactory,
    RabbitmqMessagingConsumer,
  ],
})
export class MessagingRabbitmqExtensionModule {}
