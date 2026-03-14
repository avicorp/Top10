# Interview Decision Framework

A practical cheat sheet giving you a structured approach to confidently select the right components and justify your trade-offs during a system design interview.

---

## 1. Database Selection

- **Clear relationships + ACID required?** → Relational DB (PostgreSQL, Aurora)
- **Variable schema / document-shaped data?** → Document store (MongoDB)
- **Millions of writes per second?** → Wide-column store (Cassandra) or LSM-backed DB
- **Relationships are the query (social graphs, fraud)?** → Graph DB (Neo4j, Neptune)
- **Time-ordered metrics / sensor data?** → Time-series DB (InfluxDB, TimescaleDB)
- **Need full-text search?** → Elasticsearch as a secondary store, synced via CDC or Kafka
- **Need SQL but at global scale?** → NewSQL (CockroachDB, Spanner)

---

## 2. Caching Strategy

- **Read-heavy, mostly static data?** → Cache-aside with a generous TTL
- **Consistency is critical with moderate writes?** → Write-through cache
- **Write throughput is the bottleneck?** → Write-behind cache (accept eventual consistency)
- **Cold starts are intolerable?** → Refresh-ahead with predictive prefetching
- **Sessions or short-lived state?** → Redis with TTL eviction
- **High risk of hot key stampede?** → Mutex pattern, probabilistic early refresh, and TTL jitter

---

## 3. Queue / Streaming Selection

- **Need replayability, audit log, or multiple independent consumers?** → Event stream (Kafka, Kinesis)
- **Require complex routing or exchange logic?** → RabbitMQ
- **Want fully managed, serverless-friendly?** → AWS SQS (Standard or FIFO)
- **Need strict ordering within an entity?** → Kafka with key-based partitioning
- **Need exactly-once semantics for financial transactions?** → Kafka transactional API + idempotent consumers
- **Need a simple fire-and-forget task queue?** → SQS Standard or Redis `LPUSH`/`BRPOP`

---

## 4. Data Structure Selection

- **Membership test with minimal memory?** → Bloom filter
- **Count distinct elements at scale?** → HyperLogLog
- **Sorted scores for a ranked leaderboard?** → Redis sorted set (skip list internally)
- **Prefix search or autocomplete?** → Trie or Radix Tree
- **Full-text search?** → Inverted index (Elasticsearch)
- **Distributed key routing?** → Consistent hashing
- **Write-optimized embedded storage?** → LSM-tree (RocksDB, LevelDB)

---

## The Golden Rule

Always justify your choices with explicit trade-offs:

> *"I chose X because it gives us Y, but this means we accept Z."*

Start with the simplest solution. Only add complexity when pushed on scale, failure scenarios, or cost. The best answers are collaborative conversations, not recitations.
