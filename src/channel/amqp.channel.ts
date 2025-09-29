import { Channel } from '@nestjstools/messaging';
import { RmqChannelConfig } from './rmq-channel.config';
import { Connection } from 'rabbitmq-client';

export class AmqpChannel extends Channel<
  RmqChannelConfig
> {
  public readonly connection: Connection;
  public readonly config: RmqChannelConfig;

  constructor(config: RmqChannelConfig) {
    super(config);
    this.connection = new Connection(config.connectionUri);
  }

  async onChannelDestroy(): Promise<void> {
    await this.connection.close();
    return Promise.resolve();
  }
}
