import { ChannelConfig } from '@nestjstools/messaging';

export class RmqChannelConfig extends ChannelConfig {
  /**
   * @description Connection URI for RabbitMQ server
   */
  public readonly connectionUri: string;

  /**
   * @description Name of the RabbitMQ exchange
   */
  public readonly exchangeName: string;

  /**
   * @description Type of the RabbitMQ exchange (topic, fanout, direct)
   */
  public readonly exchangeType: ExchangeType;

  /**
   * @description Name of the queue to bind to the exchange
   */
  public readonly queue: string;

  /**
   * @description Routing keys used to bind the queue to the exchange
   */
  public readonly bindingKeys?: string[];

  /**
   * @description Whether to automatically create exchange and queue if they don't exist
   */
  public readonly autoCreate?: boolean;

  /**
   * @description Enable dead letter queue functionality for failed messages
   */
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
