<p align="center">
    <image src="nestjstools-logo.png" width="400">
</p>

# @nestjstools/messaging-rabbitmq-extension

A NestJS library for managing asynchronous and synchronous messages with support for buses, handlers, channels, and consumers. This library simplifies building scalable and decoupled applications by facilitating robust message handling pipelines while ensuring flexibility and reliability.

## Installation

```bash
npm install @nestjstools/messaging @nestjstools/messaging-rabbitmq-extension 
```

or

```bash
yarn add @nestjstools/messaging @nestjstools/messaging-rabbitmq-extension
```
## RabbitMQ Integration: Messaging Configuration Example

---

```typescript
import {MessagingModule} from '@nestjstools/messaging';
import {InMemoryChannelConfig, AmqpChannelConfig, ExchangeType} from '@nestjstools/messaging/channels';
import {SendMessageHandler} from './handlers/send-message.handler';
import {MessagerRabbitmqExtensionModule} from "@nestjstools/messager-rabbitmq-extension.module";

@Module({
   imports: [
      MessagerRabbitmqExtensionModule,
      MessagingModule.forRoot({
         messageHandlers: [SendMessageHandler],
         buses: [
            {
               name: 'message.bus',
               channels: ['my-channel'],
            },
            {
               name: 'command-bus', //The naming is very flexible
               channels: ['amqp-command'], //be sure if you defined same channels name as you defined below 
            },
            {
               name: 'event-bus',
               channels: ['amqp-event'],
            },
         ],
         channels: [
            new InMemoryChannelConfig({
               name: 'my-channel',
               middlewares: [],
            }),
            new AmqpChannelConfig({
               name: 'amqp-command',
               connectionUri: 'amqp://guest:guest@localhost:5672/',
               exchangeName: 'my_app_command.exchange',
               bindingKeys: ['my_app.command.#'],
               exchangeType: ExchangeType.TOPIC,
               middlewares: [],
               queue: 'my_app.command',
               autoCreate: true, // Create exchange, queue & bind keys
            }),
            new AmqpChannelConfig({
               name: 'amqp-event',
               connectionUri: 'amqp://guest:guest@localhost:5672/',
               exchangeName: 'my_app_event.exchange',
               bindingKeys: ['my_app_event.#'],
               exchangeType: ExchangeType.TOPIC,
               queue: 'my_app.event',
               avoidErrorsForNotExistedHandlers: true, // We can avoid errors if we don't have handler yet for the event
               autoCreate: true,
            }),
         ],
         debug: true,
      }),
   ],
})
export class AppModule {
}
```

---

### Key Features:

1. **Multiple Message Buses**:
    - Configure distinct buses for **in-memory**, **commands**, and **events**:
        - `message.bus` (in-memory).
        - `command.message-bus` (AMQP command processing).
        - `event.message-bus` (AMQP event processing).

2. **In-Memory Channel**:
    - Simple and lightweight channel suitable for non-persistent messaging or testing purposes.

3. **AMQP Channels**:
    - Fully integrated RabbitMQ channel configuration using `AmqpChannelConfig`.

4. **Channel Details**:
    - `connectionUri`: Specifies the RabbitMQ server connection.
    - `exchangeName`: The AMQP exchange to publish or consume messages from.
    - `bindingKeys`: Define message routing patterns using wildcards (e.g., `my_app.command.#`).
    - `exchangeType`: Supports RabbitMQ exchange types such as `TOPIC`.
    - `queue`: Specify a RabbitMQ queue to consume messages from.
    - `autoCreate`: Automatically creates the exchange, queue, and bindings if they don’t exist.

5. **Error Handling**:
    - Use `avoidErrorsForNotExistedHandlers` in `amqp-event` to gracefully handle missing handlers for event messages.

6. **Debug Mode**:
    - Enable `debug: true` to assist in monitoring and troubleshooting messages.

This configuration provides a solid foundation for integrating RabbitMQ as part of your messaging system. It facilitates the decoupling of commands, events, and in-memory operations, ensuring reliable and scalable communication across distributed systems.

---

## Mapping Messages in RabbitMQ Channel

### Topic Exchange
For optimal routing, it's recommended to use routing keys as part of the binding key. For example, if you bind a queue with the key `my_app.command.#`, messages with routing keys like `my_app.command.domain.action` will automatically be routed to that queue. This ensures that any message with a routing key starting with `my_app.command` is directed to the appropriate queue.
Here's a more concise and clear version of your explanation:

### Direct Exchange
Ensure your queue has defined binding keys, as messages will be routed to queues based on these keys. If no binding keys are defined, the routing key in RabbitMQ will default to the routing key specified in the handler.

### Additional
* You can override message routing using `AmqpMessageOptions`. This allows sending a message to a specified exchange and routing it with a custom key.
    ```typescript
    this.messageBus.dispatch(new RoutingMessage(new SendMessage('Hello Rabbit!'), 'app.command.execute', new AmqpMessageOptions('exchange_name', 'rabbitmq_routing_key_to_queue')));
    ```

---

## Configuration options

### AmqpChannel

#### **AmqpChannelConfig**

| **Property**                           | **Description**                                                                  | **Default Value** |
|----------------------------------------|----------------------------------------------------------------------------------|-------------------|
| **`name`**                             | Name of the AMQP channel (e.g., `'amqp-command'`).                               |                   |
| **`connectionUri`**                    | URI for the RabbitMQ connection, such as `'amqp://guest:guest@localhost:5672/'`. |                   |
| **`exchangeName`**                     | The AMQP exchange name (e.g., `'my_app.exchange'`).                              |                   |
| **`bindingKeys`**                      | The routing keys to bind to (e.g., `['my_app.command.#']`).                      | `[]`              |
| **`exchangeType`**                     | Type of the RabbitMQ exchange (e.g., `TOPIC`).                                   |                   |
| **`queue`**                            | The AMQP queue to consume messages from (e.g., `'my_app.command'`).              |                   |
| **`autoCreate`**                       | Automatically creates the exchange, queue, and bindings if they don’t exist.     | `true`            |
| **`enableConsumer`**                   | Enables or disables the consumer for this channel.                               | `true`            |
| **`avoidErrorsForNotExistedHandlers`** | Avoid errors if no handler is available for the message.                         | `false`           |

This table provides a structured overview of the **`MessagingModule.forRoot`** configuration, with details about each property within **buses** and **channels** and their corresponding default values.

---
