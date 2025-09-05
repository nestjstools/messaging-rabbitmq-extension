import { Channel } from '@nestjstools/messaging';
import { RmqChannelConfig as ExtensionAmqpChannelConfig } from './rmq-channel.config';
import * as amqp from 'amqplib';

export class AmqpChannel extends Channel<ExtensionAmqpChannelConfig> {
  public connection?: any;
  public channel?: any;
  public readonly config: ExtensionAmqpChannelConfig;

  constructor(config: ExtensionAmqpChannelConfig) {
    super(config);
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.connection && this.channel) {
      return Promise.resolve();
    }

    this.connection = undefined;
    this.channel = undefined;

    this.connection = await amqp.connect(this.config.connectionUri);
    this.channel = await this.connection.createChannel();

    if (this.config.queue) {
      await this.channel.assertQueue(this.config.queue, { durable: true });
    }
  }

  async onChannelDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = undefined;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }
}
