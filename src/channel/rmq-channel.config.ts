import { ChannelConfig } from '@nestjstools/messaging';

export class RmqChannelConfig extends ChannelConfig {
  public readonly connectionUri: string;
  public readonly exchangeName: string;
  public readonly exchangeType: ExchangeType;
  public readonly queue: string;
  public readonly bindingKeys?: string[];
  public readonly autoCreate?: boolean;
  public readonly deadLetterQueueFeature?: boolean;
  /**
   * @description Number of times to retry a message before sending it to the dead letter queue. Only applicable if `deadLetterQueueFeature` is enabled.
   */
  public readonly retryMessage?: number;

  constructor({
    name,
    connectionUri,
    exchangeName,
    exchangeType,
    queue,
    enableConsumer,
    bindingKeys,
    autoCreate,
    deadLetterQueueFeature,
    avoidErrorsForNotExistedHandlers,
    middlewares,
    normalizer,
    retryMessage,
  }: RmqChannelConfig) {
    super(
      name,
      avoidErrorsForNotExistedHandlers,
      middlewares,
      enableConsumer,
      normalizer,
    );
    this.connectionUri = connectionUri;
    this.exchangeName = exchangeName;
    this.exchangeType = exchangeType;
    this.queue = queue;
    this.bindingKeys = bindingKeys;
    this.autoCreate = autoCreate ?? true;
    this.deadLetterQueueFeature = deadLetterQueueFeature ?? false;
    this.retryMessage = retryMessage;
  }
}

export enum ExchangeType {
  TOPIC = 'topic',
  FANOUT = 'fanout',
  DIRECT = 'direct',
}
