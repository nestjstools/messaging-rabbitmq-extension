import { Channel } from '@nestjstools/messaging';
import { AmqpChannelConfig, ChannelConfig } from '@nestjstools/messaging';
import { Connection } from 'rabbitmq-client';
import { InvalidChannelConfigException } from '@nestjstools/messaging';

export class AmqpChannel extends Channel {
  public readonly connection: Connection;
  public readonly config: AmqpChannelConfig;

  constructor(config: ChannelConfig) {
    if (!(config instanceof AmqpChannelConfig)) {
      throw new InvalidChannelConfigException(AmqpChannelConfig.name);
    }

    super(config);

    this.connection = new Connection(config.connectionUri);
  }
}
