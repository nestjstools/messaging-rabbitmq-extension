import { RoutingMessage } from '@nestjstools/messaging';
import { IMessageBus } from '@nestjstools/messaging';
import { Injectable } from '@nestjs/common';
import { Connection } from 'rabbitmq-client';
import { AmqpMessageOptions } from '../message/amqp-message-options';
import { AmqpChannel } from '../channel/amqp.channel';
import { ExchangeType } from '@nestjstools/messaging';
import { AmqpMessageBuilder } from './amqp-message.builder';
import { RABBITMQ_HEADER_ROUTING_KEY } from '../const';

@Injectable()
export class AmqpMessageBus implements IMessageBus {
  private readonly connection: Connection;

  constructor(private readonly amqpChanel: AmqpChannel) {
    this.connection = amqpChanel.connection;
  }

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
    const publisher = await this.connection.createPublisher();
    await publisher.send(amqpMessage.envelope, amqpMessage.message);
    await publisher.close();
  }

  private createMessageBuilderWhenUndefined(
    message: RoutingMessage,
  ): AmqpMessageBuilder {
    const messageBuilder = AmqpMessageBuilder.create();

    messageBuilder
      .withMessage(message.message)
      .withExchangeName(this.amqpChanel.config.exchangeName);

    if (this.amqpChanel.config.exchangeType === ExchangeType.DIRECT) {
      messageBuilder.withRoutingKey(this.getRoutingKey(message));
    }

    if (this.amqpChanel.config.exchangeType === ExchangeType.TOPIC) {
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
        options.exchangeName ?? this.amqpChanel.config.exchangeName,
      )
      .withRoutingKey(options.routingKey ?? this.getRoutingKey(message))
      .withHeaders(options.headers);

    return messageBuilder;
  }

  private getRoutingKey(message: RoutingMessage): string {
    return this.amqpChanel.config.bindingKeys !== undefined
      ? this.amqpChanel.config.bindingKeys.length > 0
        ? this.amqpChanel.config.bindingKeys[0]
        : message.messageRoutingKey
      : message.messageRoutingKey;
  }
}
