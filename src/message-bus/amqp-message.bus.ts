import { RoutingMessage } from '@nestjstools/messaging';
import { IMessageBus } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { AmqpChannel } from '../channel/amqp.channel';
import { AmqpMessageOptions } from '../message/amqp-message-options';
import { ExchangeType } from '@nestjstools/messaging';
import { AmqpMessageBuilder } from './amqp-message.builder';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';

@Injectable()
export class AmqpMessageBus implements IMessageBus {
  constructor(private readonly amqpChannel: AmqpChannel) {}

  async dispatch(message: RoutingMessage): Promise<object | void> {
    if (
      message.messageOptions !== undefined &&
      !(message.messageOptions instanceof AmqpMessageOptions)
    ) {
      throw new Error(
        `Message options must be a ${AmqpMessageOptions.name} object`,
      );
    }

    const messageBuilder: AmqpMessageBuilder =
      message.messageOptions === undefined
        ? this.createMessageBuilderWhenUndefined(message)
        : this.createMessageBuilderWhenDefined(message);

    messageBuilder.addHeader(
      RABBITMQ_HEADER_ROUTING_KEY,
      message.messageRoutingKey,
    );

    const amqpMessage = messageBuilder.buildMessage();

    if (!this.amqpChannel.channel) {
      throw new Error('AMQP channel not initialized. Did you call init()?');
    }

    await this.amqpChannel.channel.publish(
      amqpMessage.envelope.exchange,
      amqpMessage.envelope.routingKey,
      Buffer.from(JSON.stringify(amqpMessage.message)),
      {
        headers: amqpMessage.envelope.headers,
      },
    );
  }

  private createMessageBuilderWhenUndefined(
    message: RoutingMessage,
  ): AmqpMessageBuilder {
    const messageBuilder = AmqpMessageBuilder.create();

    messageBuilder
      .withMessage(message.message)
      .withExchangeName(this.amqpChannel.config.exchangeName);

    if (this.amqpChannel.config.exchangeType === ExchangeType.DIRECT) {
      messageBuilder.withRoutingKey(this.getRoutingKey(message));
    }

    if (this.amqpChannel.config.exchangeType === ExchangeType.TOPIC) {
      messageBuilder.withRoutingKey(message.messageRoutingKey);
    }

    return messageBuilder;
  }

  private createMessageBuilderWhenDefined(
    message: RoutingMessage,
  ): AmqpMessageBuilder {
    const options = message.messageOptions as AmqpMessageOptions;
    const messageBuilder = AmqpMessageBuilder.create();

    messageBuilder
      .withMessage(message.message)
      .withExchangeName(
        options.exchangeName ?? this.amqpChannel.config.exchangeName,
      )
      .withRoutingKey(options.routingKey ?? this.getRoutingKey(message))
      .withHeaders(options.headers);

    return messageBuilder;
  }

  private getRoutingKey(message: RoutingMessage): string {
    return this.amqpChannel.config.bindingKeys !== undefined
      ? this.amqpChannel.config.bindingKeys.length > 0
        ? this.amqpChannel.config.bindingKeys[0]
        : message.messageRoutingKey
      : message.messageRoutingKey;
  }
}
