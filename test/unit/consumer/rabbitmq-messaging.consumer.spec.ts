import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumerDispatchedMessageError } from '@nestjstools/messaging';
import { RabbitmqMessagingConsumer } from '../../../src/consumer/rabbitmq-messaging.consumer';
import { RabbitmqMigrator } from '../../../src/migrator/rabbitmq.migrator';
import { MessageRetrierVisitor } from '../../../src/consumer/message-retrier.visitor';
import { MessageDeadLetterVisitor } from '../../../src/consumer/message-dead-letter.visitor';
import { AmqpChannel } from '../../../src/channel/amqp.channel';
import { RABBITMQ_HEADER_RETRY_COUNT } from '../../../src/const';

describe('RabbitmqMessagingConsumer - onError', () => {
  let consumer: RabbitmqMessagingConsumer;
  let mockMigrator: jest.Mocked<RabbitmqMigrator>;
  let mockRetrier: jest.Mocked<MessageRetrierVisitor>;
  let mockDeadLetter: jest.Mocked<MessageDeadLetterVisitor>;
  let mockChannel: jest.Mocked<AmqpChannel>;
  let mockAmqpChannel: jest.Mocked<ChannelWrapper>;

  beforeEach(() => {
    mockMigrator = {
      run: jest.fn(),
    } as any;

    mockRetrier = {
      retryMessage: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockDeadLetter = {
      sendToDeadLetter: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockChannel = {
      config: {
        retryMessage: 3,
        deadLetterQueueFeature: true,
      },
    } as any;

    mockAmqpChannel = {} as any;

    consumer = new RabbitmqMessagingConsumer(mockMigrator, mockRetrier, mockDeadLetter);
    (consumer as any).channel = mockChannel;
    (consumer as any).amqpChannel = mockAmqpChannel;
  });

  describe('onError', () => {
    it('should return early if no amqpChannel is available', async () => {
      (consumer as any).amqpChannel = undefined;

      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: 1 },
        },
      } as any;

      const result = await consumer.onError(mockErrored, mockChannel);

      expect(result).toBeUndefined();
      expect(mockRetrier.retryMessage).not.toHaveBeenCalled();
      expect(mockDeadLetter.sendToDeadLetter).not.toHaveBeenCalled();
    });

    it('should retry message when retry count is below limit', async () => {
      const currentRetryCount = 2;
      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: currentRetryCount },
        },
      } as any;

      await consumer.onError(mockErrored, mockChannel);

      expect(mockRetrier.retryMessage).toHaveBeenCalledWith(
        mockErrored,
        mockChannel,
        mockAmqpChannel,
        currentRetryCount,
      );
      expect(mockDeadLetter.sendToDeadLetter).not.toHaveBeenCalled();
    });

    it('should send to dead letter when retry limit is exceeded', async () => {
      const currentRetryCount = 5; // Above limit of 3
      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: currentRetryCount },
        },
      } as any;

      await consumer.onError(mockErrored, mockChannel);

      expect(mockRetrier.retryMessage).not.toHaveBeenCalled();
      expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalledWith(
        mockErrored,
        mockChannel,
        mockAmqpChannel,
      );
    });

    it('should send to dead letter when no retry config is set', async () => {
      const mockChannelWithoutRetry = {
        config: {
          retryMessage: undefined,
          deadLetterQueueFeature: true,
        },
      } as any;

      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: 1 },
        },
      } as any;

      await consumer.onError(mockErrored, mockChannelWithoutRetry);

      expect(mockRetrier.retryMessage).not.toHaveBeenCalled();
      expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalledWith(
        mockErrored,
        mockChannelWithoutRetry,
        mockAmqpChannel,
      );
    });

    it('should not send to dead letter when feature is disabled', async () => {
      const mockChannelDisabled = {
        config: {
          retryMessage: undefined,
          deadLetterQueueFeature: false,
        },
      } as any;

      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: 1 },
        },
      } as any;

      await consumer.onError(mockErrored, mockChannelDisabled);

      expect(mockRetrier.retryMessage).not.toHaveBeenCalled();
      expect(mockDeadLetter.sendToDeadLetter).not.toHaveBeenCalled();
    });

    it('should handle retry count at exact limit', async () => {
      const currentRetryCount = 3; // Equal to limit
      const mockErrored: ConsumerDispatchedMessageError = {
        dispatchedConsumerMessage: {
          metadata: { [RABBITMQ_HEADER_RETRY_COUNT]: currentRetryCount },
        },
      } as any;

      await consumer.onError(mockErrored, mockChannel);

      expect(mockRetrier.retryMessage).not.toHaveBeenCalled();
      expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalledWith(
        mockErrored,
        mockChannel,
        mockAmqpChannel,
      );
    });
  });
});
