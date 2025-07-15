import { AmqpChannelConfig, Channel } from '@nestjstools/messaging';
import { RmqChannelConfig as ExtensionAmqpChannelConfig } from './rmq-channel.config';
import { Connection } from 'rabbitmq-client';

export class AmqpChannel extends Channel<
  AmqpChannelConfig | ExtensionAmqpChannelConfig
> {
  public readonly connection: Connection;
  public readonly config: AmqpChannelConfig | ExtensionAmqpChannelConfig;

  constructor(config: AmqpChannelConfig | ExtensionAmqpChannelConfig) {
    super(config);
    this.connection = new Connection(config.connectionUri);
  }

  async onChannelDestroy(): Promise<void> {
    await this.connection.close();
    return Promise.resolve();
  }
}
