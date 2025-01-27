import { Channel } from '@nestjstools/messaging';
import { AmqpChannelConfig, ChannelConfig } from '@nestjstools/messaging';
import { Connection } from 'rabbitmq-client';

export class AmqpChannel implements Channel {
  public readonly connection: Connection;
  public readonly config: AmqpChannelConfig;

  constructor(
    config: ChannelConfig,
  ) {
    if (!(config instanceof AmqpChannelConfig)) {
      throw new Error();
    }

    this.config = config;
    this.connection = new Connection(config.connectionUri);
  }
}
