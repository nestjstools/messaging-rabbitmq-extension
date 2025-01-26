import { MessageOptions } from '@nestjstools/messaging/message/message-options';
import { Middleware } from '@nestjstools/messaging/middleware/middleware';

export class AmqpMessageOptions implements MessageOptions {
  constructor(
    public readonly exchangeName: string|undefined = undefined,
    public readonly routingKey: string|undefined = undefined,
    public readonly middlewares: Middleware[] = [],
    public readonly headers: { [key: string]: string } = {},
  ) {
  }
}
