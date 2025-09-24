import { Channel } from '@nestjstools/messaging';
import { RmqChannelConfig as ExtensionAmqpChannelConfig } from './rmq-channel.config';
import * as amqp from 'amqplib';

export class AmqpChannel extends Channel<ExtensionAmqpChannelConfig> {
  public connection?: any;
  public readonly config: ExtensionAmqpChannelConfig;

  constructor(config: ExtensionAmqpChannelConfig) {
    super(config);
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.connection) {
      return Promise.resolve();
    }

    this.connection = undefined;

    this.connection = await amqp.connect(this.config.connectionUri);
    this.connection.on('close', (err: any) => {
      console.error('AMQP Connection error:', err);
      process.exit(0);
    });
  }

  async onChannelDestroy(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }
}
