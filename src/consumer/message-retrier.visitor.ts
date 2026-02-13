import { AmqpChannel } from '../channel/amqp.channel';
import { RABBITMQ_HEADER_RETRY_COUNT } from '../const';
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
  ): Promise<void> {
    if (channel.config.retryMessage) {
      const limit = channel.config.retryMessage;
      const retryCount = errored.dispatchedConsumerMessage.metadata[RABBITMQ_HEADER_RETRY_COUNT] ?? 0;

      if (retryCount < limit) {
        const newRetryCount = retryCount + 1;
        await amqpChannel.publish(
          channel.config.exchangeName,
          errored.dispatchedConsumerMessage.routingKey,
          Buffer.from(JSON.stringify(errored.dispatchedConsumerMessage.message)),
          {
            headers: {
              [RABBITMQ_HEADER_RETRY_COUNT]: newRetryCount,
            },
          } as Options.Publish,
        );

        return Promise.resolve();
      }
    }
  }
}
