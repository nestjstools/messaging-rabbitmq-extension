import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_RETRY_COUNT, RABBITMQ_HEADER_ROUTING_KEY } from '../const';
import { Injectable } from '@nestjs/common';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Options } from 'amqplib';

@Injectable()
export class MessageRetrierVisitor {
  async retryMessage(
    errored: ConsumerDispatchedMessageError,
    channel: AmqpChannel,
    amqpChannel: ChannelWrapper,
    currentRetryCount: number,
  ): Promise<void> {
      const newRetryCount = currentRetryCount + 1;
      await amqpChannel.publish(
        `${channel.config.exchangeName}_retry.exchange`,
        errored.dispatchedConsumerMessage.routingKey,
        Buffer.from(JSON.stringify(errored.dispatchedConsumerMessage.message)),
        {
          headers: {
            [RABBITMQ_HEADER_RETRY_COUNT]: newRetryCount,
            [RABBITMQ_HEADER_ROUTING_KEY]:
            errored.dispatchedConsumerMessage.routingKey,
          },
        } as Options.Publish,
      );

      return Promise.resolve();
  }
}
