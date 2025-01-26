import { Channel } from '@nestjstools/messaging/channel/channel';
import { AmqpChannelConfig, ChannelConfig } from '@nestjstools/messaging/config';
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
