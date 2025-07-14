import { Envelope } from 'rabbitmq-client';

export class AmqpMessageBuilder {
  private constructor(
    private exchangeName: string = undefined,
    private routingKey: string = undefined,
    private headers: { [key: string]: string } = undefined,
    private message: object = undefined,
  ) {}

  static create(): AmqpMessageBuilder {
    return new AmqpMessageBuilder();
  }

  withExchangeName(exchangeName: string): AmqpMessageBuilder {
    this.exchangeName = exchangeName;
    return this;
  }

  withRoutingKey(routingKey: string): AmqpMessageBuilder {
    this.routingKey = routingKey;
    return this;
  }

  withHeaders(headers: { [key: string]: string }): AmqpMessageBuilder {
    this.headers = headers;
    return this;
  }

  addHeader(key: string, value: string): AmqpMessageBuilder {
    if (!this.headers) {
      this.headers = {};
    }

    this.headers[key] = value;
    return this;
  }

  withMessage(message: object): AmqpMessageBuilder {
    this.message = message;
    return this;
  }

  buildMessage(): AmqpMessage {
    if (this.exchangeName === undefined) {
      throw new Error('Exchange name must be defined');
    }

    if (this.routingKey === undefined) {
      throw new Error('RoutingKey name must be defined');
    }

    if (this.message === undefined) {
      throw new Error('Message name must be defined');
    }

    return {
      message: this.message,
      envelope: {
        exchange: this.exchangeName,
        routingKey: this.routingKey,
        headers: this.headers,
      },
    };
  }
}

interface AmqpMessage {
  message: object;
  envelope: Envelope;
}
