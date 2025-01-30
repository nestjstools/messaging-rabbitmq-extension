import { Channel } from '@nestjstools/messaging';
import { AmqpChannelConfig } from '@nestjstools/messaging';
import { Connection } from 'rabbitmq-client';

export class AmqpChannel extends Channel<AmqpChannelConfig> {
  public readonly connection: Connection;
  public readonly config: AmqpChannelConfig;

  constructor(config: AmqpChannelConfig) {
    super(config);
    this.connection = new Connection(config.connectionUri);
  }
}
