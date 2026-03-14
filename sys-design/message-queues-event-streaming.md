# Message Queues & Event Streaming

This section covers how to decouple different parts of your system. Using queues and streams enables asynchronous processing, provides backpressure, and improves your system's overall fault tolerance.

---

## 1. Core Concepts

- **Producer & Consumer**: A producer publishes messages to a queue or topic. A consumer reads and processes those messages, typically working alongside others in a consumer group.
- **Broker**: The server that actually stores and routes the messages (like a Kafka broker or RabbitMQ node).
- **Topic vs. Queue**: Both are named channels, but topics are designed for multiple subscribers, whereas queues are typically meant for a single consumer.
- **Acknowledgment (ACK)**: A signal sent by the consumer to confirm a message was successfully processed before it gets removed.
- **Dead Letter Queue (DLQ)**: A special queue where messages that repeatedly fail processing are routed for manual inspection or later replay.
- **Backpressure**: A mechanism where consumers signal that they are overwhelmed, causing producers to slow down their message generation.

---

## 2. Message Queue vs. Event Stream

Though often used interchangeably, queues and streams serve different architectural purposes.

| Property | Message Queue | Event Stream |
| --- | --- | --- |
| **Message Lifetime** | Deleted after an ACK | Retained for a configurable period (e.g., days or weeks) |
| **Consumption** | Single consumer or competing consumers | Multiple independent consumer groups |
| **Replayability** | Not possible after the message is ACKed | Yes, you can seek to any offset or timestamp |
| **Ordering** | Strict FIFO within the queue | Ordered specifically within a partition |
| **Primary Examples** | RabbitMQ, SQS, ActiveMQ | Kafka, Kinesis, Pulsar |

---

## 3. Apache Kafka

Kafka is the gold standard for high-throughput, fault-tolerant, and replayable event pipelines.

- **Architecture**: Events are categorized into logical streams called **Topics**, which are divided into **Partitions** for parallelism. Each partition is an ordered, immutable append-only log, and key-based partitioning guarantees ordering per entity. Consumers track their sequential position using an **Offset**.
- **Delivery Guarantees**:
  - *At-most-once*: Fast, but messages might be lost (though never duplicated).
  - *At-least-once*: The default setting; messages won't be lost but might be duplicated, requiring idempotent consumers.
  - *Exactly-once*: No loss and no duplicates, which requires transactional consumers and idempotent producers.
- **Interview Tip**: Kafka's throughput scales by adding partitions, not just brokers. The maximum consumer parallelism within a group is exactly equal to the number of partitions.

---

## 4. RabbitMQ & AWS SQS

When you don't need the massive throughput of an event stream, traditional message brokers are often the better choice.

### RabbitMQ

A traditional AMQP broker that excels when you need fine-grained routing logic or task-queue semantics rather than pure throughput.

- Flexible exchange types (Direct, Fanout, Topic, Headers)
- Manual ACKs for safe retries
- Built-in priority queues (which Kafka lacks natively)

### AWS SQS

A fully managed queue service.

- *Standard Queues*: Near-unlimited throughput and at-least-once delivery with best-effort ordering (the cheapest option).
- *FIFO Queues*: Exactly-once processing and strict ordering within a message group, but capped at lower throughput limits.
- Uses a "visibility timeout" to hide messages from other consumers during processing, requeuing them if they aren't deleted in time.

---

## 5. Key Messaging Patterns

- **Point-to-Point (Task Queue)**: One producer sends tasks to competing consumers in a group, ensuring each task (like resizing an image or sending an email) is processed by exactly one worker.
- **Publish-Subscribe (Fan-out)**: One producer fans out events to multiple independent consumer groups. For example, an "order placed" event is sent to inventory, notification, and analytics services simultaneously.
- **Outbox Pattern**: To guarantee at-least-once delivery even if the message broker goes down, you write to your database and a local "outbox" table in a single transaction. A separate relay process then publishes the outbox rows to the queue.
- **Saga Pattern**: Used to coordinate multi-step workflows across microservices. It can be done via *Choreography* (decentralized, where services react to events) or *Orchestration* (a central controller issues commands).

### Interview Tip on Idempotency

If an interviewer asks how to prevent double-processing, the answer is idempotent consumers combined with deduplication keys. For Kafka, store the last processed offset in the same database transaction as your business logic; for SQS, use a deduplication key stored in Redis with a TTL.
