# System Design Interview - Complete Reference Guide

**Databases - Caching - Message Queues - Data Structures**

Backend Engineering Edition

---

## 1. Types of Databases

Choosing the right database is one of the most critical decisions in system design. Each category has distinct trade-offs in consistency, scalability, query flexibility, and operational complexity.

### 1.1 Relational Databases (RDBMS)

Store data in structured tables with predefined schemas, relationships via foreign keys, and full ACID compliance.

- **ACID**: Atomicity, Consistency, Isolation, Durability — all-or-nothing transactions
- **SQL**: Supports complex joins, aggregations, window functions, transactions
- **Normalization**: Reduces data duplication; enforces referential integrity
- **Scaling**: Vertical first, then read replicas; horizontal sharding breaks joins

**Primary Examples:**

- **PostgreSQL**: Best-in-class JSON (JSONB), full-text search, powerful extensions (PostGIS, TimescaleDB)
- **MySQL**: Widely deployed, excellent replication, battle-tested in LAMP stacks
- **Amazon Aurora**: MySQL/PostgreSQL-compatible, up to 5x throughput, managed failover

> **Interview Tip — Scaling RDBMS**
> Discuss read replicas first, then connection pooling (PgBouncer), then vertical scaling. Bring up sharding only when necessary — it breaks joins and adds app-layer complexity. Mention CQRS + event sourcing as an architectural alternative before reaching for NoSQL.

### 1.2 Document Stores

Store semi-structured JSON/BSON documents. Schema-flexible — each document in a collection can have different fields.

- **Use when**: Data is hierarchical, schema evolves frequently, or per-entity shapes vary
- **Watch out for**: Denormalization leads to update anomalies; cross-document transactions are expensive
- **MongoDB**: Rich aggregation pipeline, Atlas Search, built-in sharding. Best for content, catalogs, user profiles
- **Couchbase**: Adds an in-memory caching layer for low-latency reads; good for mobile-sync workloads

### 1.3 Key-Value Stores

The simplest model — a distributed hash map. Extremely fast lookups, limited querying. Backbone of caching and session storage.

- **Redis**: In-memory, rich types (strings, hashes, lists, sets, sorted sets, streams, HyperLogLog), TTL support
  - Best for: caching, sessions, pub/sub, rate limiting, leaderboards, distributed locks
- **DynamoDB**: AWS-managed, single-digit ms latency at any scale, event-driven via DynamoDB Streams
  - Best for: serverless, IoT, gaming, high-throughput key lookups
- **Memcached**: Simpler than Redis, multi-threaded, pure LRU. No persistence or rich data types

### 1.4 Wide-Column Stores

Rows can have thousands of columns in column families. Optimized for time-ordered range scans and high write throughput across distributed nodes.

- **Cassandra**: Masterless ring, linear horizontal scalability, tunable consistency, no single point of failure
  - Data modeling is query-driven — design tables around access patterns, not normalization
  - Best for: IoT sensor data, activity feeds, time-series, write-heavy workloads at massive scale
- **HBase**: Built on HDFS, strong consistency, tight integration with Hadoop/Spark ecosystem

> **Interview Tip — Cassandra Consistency**
> Cassandra's consistency is tunable per-operation: ONE, QUORUM, ALL. For strong consistency: QUORUM reads + QUORUM writes where R + W > N. Replication factor of 3 is standard for production. This is a very common follow-up question.

### 1.5 Graph Databases

Model data as nodes (entities) and edges (relationships). Multi-hop relationship traversal is O(log n) vs exponential cost of recursive SQL joins.

- **Neo4j**: ACID-compliant, Cypher query language. Best for: social graphs, fraud detection, recommendations
- **Amazon Neptune**: Managed, supports both Gremlin (property graph) and SPARQL (RDF)
- **Use when**: The relationships between data are as important as the data itself

### 1.6 Time-Series Databases

Append-heavy, optimized for sequential writes and time-based range queries. Compress temporal data via delta encoding.

- **InfluxDB**: Purpose-built for metrics and events. Retention policies, continuous queries, downsampling
- **TimescaleDB**: PostgreSQL extension — full SQL with time-series performance; easy migration path
- **Prometheus**: Pull-based metrics collection, PromQL query language, standard in Kubernetes stacks

### 1.7 NewSQL & Search

- **CockroachDB / Google Spanner**: ACID + horizontal scalability via distributed consensus (Paxos/Raft). Higher latency due to coordination
- **Elasticsearch / Solr**: Inverted index, near real-time full-text search, log analytics (ELK stack)

### 1.8 Quick Comparison

| Type | Examples | Consistency | Best Use Case | Scale Strategy |
| --- | --- | --- | --- | --- |
| Relational | PostgreSQL, MySQL | Strong (ACID) | Transactions, reporting | Read replicas, sharding |
| Document | MongoDB | Tunable | Content, catalogs, profiles | Horizontal sharding |
| Key-Value | Redis, DynamoDB | Eventual / tunable | Cache, sessions, counters | Cluster / partitioning |
| Wide-Column | Cassandra, HBase | Tunable | IoT, feeds, time-series writes | Linear horizontal |
| Graph | Neo4j, Neptune | Strong | Social, fraud, recommendations | Vertical + partitioning |
| Time-Series | InfluxDB, TimescaleDB | Strong | Metrics, monitoring, telemetry | Time-based partitioning |
| NewSQL | CockroachDB, Spanner | Strong (ACID) | Global distributed SQL | Auto-sharding + Raft |
| Search | Elasticsearch, Solr | Eventual | Full-text, log analytics | Distributed sharding |

### CAP Theorem

You cannot simultaneously guarantee Consistency, Availability, and Partition Tolerance. CA = PostgreSQL. CP = HBase, Zookeeper. AP = Cassandra, DynamoDB. In practice, network partitions will occur, so the real choice is always CP vs AP.

---

## 2. Caching Strategies

Caching stores expensive computation or I/O results close to where they're needed. Understanding placement, population strategy, and eviction policy is essential for any design interview.

### 2.1 Cache Placement Tiers

**Client-Side**

- **Browser cache**: HTTP Cache-Control, ETag, Last-Modified. Free — built into every browser
- **CDN edge cache**: Cloudflare, CloudFront push static/dynamic assets globally — single-digit ms latency

**In-Process / Local**

- **In-memory map**: Guava Cache (Java), lru-cache (Node.js). Fastest possible — no network hop
- **Trade-off**: Not shared across instances — each pod has its own stale copy

**Distributed Cache**

- **Redis**: Most popular. Cluster mode for horizontal scale; optional persistence; rich data types
- **Memcached**: Simpler, multi-threaded, pure LRU. No persistence, sorted sets, or pub/sub
- **Hazelcast**: In-memory data grid with compute-near-data; Java ecosystem

> **Interview Tip**
> Always specify where you're placing each cache layer relative to the data flow. Typical pattern: Request -> CDN -> API Gateway -> L1 in-process cache -> L2 Redis -> Database. Each layer has different TTL, granularity, and consistency guarantees.

### 2.2 Cache Population Strategies

**Cache-Aside (Lazy Loading)**

App checks cache first. On miss, reads from DB and populates cache. The most common pattern.

- Pros: Only caches data that is actually requested; cache failure does not break reads
- Cons: Cold-start penalty; thundering herd on hot-key expiration
- Use for: General-purpose caching — user sessions, product details, API responses

**Write-Through**

Every write goes to cache AND database synchronously. Cache is always consistent with DB.

- Pros: Cache never goes stale; reads always hit cache after first write
- Cons: Write latency doubles; may cache data that is never read
- Use for: Read-heavy workloads where stale data is unacceptable (user profiles, pricing)

**Write-Behind (Write-Back)**

App writes only to cache; cache asynchronously flushes to DB after a delay.

- Pros: Lowest write latency; batches DB writes to reduce load
- Cons: Risk of data loss if cache crashes before flush; DB is temporarily inconsistent
- Use for: High-throughput counters, metrics aggregation, write-heavy workloads

**Read-Through**

Cache sits in front of DB and handles misses itself — app always talks to the cache layer.

- Pros: Simplifies application code; all reads go through one interface
- Cons: First read always slow; cache library must support all data sources

**Refresh-Ahead**

Cache proactively refreshes entries before they expire, based on predicted access patterns.

- Pros: Zero miss latency for hot data; smooth user experience
- Cons: Complex to implement; may cache data that will never be read

### 2.3 Eviction Policies

| Policy | Full Name | Behavior | Best For |
| --- | --- | --- | --- |
| LRU | Least Recently Used | Evict item not accessed for the longest time | General workloads — the typical default |
| LFU | Least Frequently Used | Evict item with fewest total accesses | Skewed / Zipf access patterns |
| FIFO | First In First Out | Evict oldest inserted item regardless of access | Simple queues, time-sensitive data |
| TTL | Time-To-Live | Evict items after fixed time since insertion | Session data, API rate limits, tokens |
| Random | Random Replacement | Evict a random item | Low overhead; approximates LRU cheaply |
| MRU | Most Recently Used | Evict the most recently used item | Cyclic scans, large sequential reads |

### 2.4 Cache Failure Patterns

**Cache Stampede / Thundering Herd**

When a popular key expires, many concurrent requests miss simultaneously and all hit the DB.

- Solution: Mutex pattern: only one request rebuilds the cache; others wait or serve stale data
- Solution: Probabilistic early recomputation: refresh before expiry based on statistical prediction
- Solution: TTL jitter: add random variance (e.g., base TTL + random(0, 30s)) to spread expiration

**Cache Penetration**

Requests for keys that never exist always bypass the cache and hit the DB.

- Solution: Cache null/empty results with a short TTL. Or use a Bloom filter to reject invalid keys

**Cache Avalanche**

Many keys expire simultaneously, flooding the DB with requests.

- Solution: Stagger TTLs with random jitter. Use circuit breakers on DB connections

> **Interview Tip**
> Proactively mentioning Cache Stampede, Cache Penetration, and Cache Avalanche as failure modes demonstrates production experience. Interviewers rarely ask about these directly — bringing them up unprompted is a strong signal.

### 2.5 Distributed Cache Internals

- **Consistent hashing**: Distribute keys across nodes so adding/removing a node only remaps ~1/N keys
- **Redis Cluster**: 16,384 hash slots divided among nodes; automatic rebalancing; requires 3+ primaries
- **Redis Sentinel**: HA without clustering: monitors primary, promotes replica on failure
- **Invalidation via events**: On DB write, publish invalidation event; consumers delete stale cache keys

---

## 3. Message Queues & Event Streaming

Queues decouple producers from consumers, enable async processing, provide backpressure, and improve fault tolerance — essential for scalable distributed systems.

### 3.1 Core Concepts

- **Producer**: Publishes messages to a queue or topic
- **Consumer**: Reads and processes messages, typically in a consumer group
- **Broker**: Server that stores and routes messages (Kafka broker, RabbitMQ node)
- **Topic / Queue**: Named channel. Topics are multi-subscriber; queues are typically single-consumer
- **Acknowledgment (ACK)**: Consumer confirms successful processing before message is removed
- **Dead Letter Queue (DLQ)**: Messages that fail repeatedly are routed here for inspection and replay
- **Backpressure**: Consumers signal they are overwhelmed; producers slow down accordingly

### 3.2 Queue vs Event Stream

| Property | Message Queue | Event Stream |
| --- | --- | --- |
| Message lifetime | Deleted after ACK | Retained for configurable period (days/weeks) |
| Consumption model | Single consumer or competing consumers | Multiple independent consumer groups |
| Replay | Not possible after ACK | Yes — seek to any offset or timestamp |
| Ordering guarantee | FIFO within queue | Ordered within a partition |
| Primary examples | RabbitMQ, SQS, ActiveMQ | Kafka, Kinesis, Pulsar, Redpanda |

### 3.3 Apache Kafka

Distributed event streaming platform. The gold standard for high-throughput, fault-tolerant, replayable event pipelines.

**Core Architecture:**

- **Topic**: Logical stream of events. Divided into partitions for parallelism
- **Partition**: Ordered, immutable append-only log. Key-based partitioning ensures ordering per entity
- **Offset**: Sequential position of a message within a partition. Consumers track their own position
- **Consumer Group**: Group receives all partitions; within a group each partition goes to exactly one consumer
- **Broker**: Kafka server that stores partitions. Leader handles reads/writes; followers replicate
- **KRaft / Zookeeper**: Manages cluster metadata and leader election (KRaft replaces ZK in newer versions)

**Delivery Guarantees:**

- **At-most-once**: Messages may be lost but never duplicated. Fast but unsafe for critical data
- **At-least-once**: Messages may be duplicated but never lost. Default — requires idempotent consumers
- **Exactly-once**: No loss, no duplicates. Requires idempotent producers + transactional consumers

**Key Production Configuration:**

- `replication.factor = 3`: Survives 2 simultaneous broker failures
- `min.insync.replicas = 2`: Write succeeds only if 2+ replicas acknowledge
- `acks = all`: Producer waits for full acknowledgment from all in-sync replicas
- `retention.ms`: How long Kafka retains events (default 7 days)

> **Interview Tip — Kafka Partitioning**
> Throughput scales by adding partitions, not just brokers. Max consumer parallelism within a group equals the number of partitions. Design partition count for your expected peak parallelism. A common mistake is under-partitioning at creation — you can increase partitions but it can break key-based ordering.

### 3.4 RabbitMQ

Traditional AMQP message broker with flexible routing logic. Better than Kafka when fine-grained routing and task-queue semantics matter more than throughput.

- **Exchange types**: Direct (routing key match), Fanout (broadcast), Topic (wildcard), Headers
- **Bindings**: Rules connecting exchanges to queues based on routing keys
- **Manual ACK**: Message stays in queue until explicitly confirmed — enables safe retry
- **Priority queues**: Built-in support. Kafka has no native priority mechanism
- **Use when**: Complex routing rules, low-latency task dispatch, or RPC-over-messaging patterns

### 3.5 AWS SQS

Fully managed queue service — no infrastructure to operate. Two queue types:

- **Standard Queue**: At-least-once, best-effort ordering, near-unlimited throughput. Cheapest option
- **FIFO Queue**: Exactly-once within message group, strict ordering, up to 3,000 msg/s with batching
- **Visibility timeout**: Message hidden from other consumers during processing; requeued if not deleted in time
- **Long polling**: Wait up to 20 seconds for a message — reduces empty responses and API cost

### 3.6 Key Messaging Patterns

**Point-to-Point (Task Queue)**

One producer, competing consumers in a group. Each task processed by exactly one worker.

- Examples: Image resize jobs, email sending, PDF generation, async API calls

**Publish-Subscribe (Fan-out)**

One producer, multiple independent consumer groups each receiving all events.

- Example: Order placed event fans out to: inventory service, notification service, analytics

**Outbox Pattern (Transactional Messaging)**

Write to DB and an outbox table in one transaction. A separate relay publishes outbox rows to the queue — guarantees at-least-once delivery even if the broker is temporarily down.

- Use for: Microservice state changes that must reliably trigger downstream events

**Saga Pattern**

Multi-step workflow coordinated via events. Each step publishes success/failure, triggering the next step or a compensating rollback transaction.

- **Choreography**: Each service listens for events and reacts — decentralized, harder to trace
- **Orchestration**: Central saga orchestrator issues commands — easier to trace, single point of failure

> **Interview Tip — Idempotency**
> When asked 'how do you prevent double-processing?': idempotent consumers + deduplication keys. For Kafka, store the last processed offset in the same DB transaction as your business logic (transactional outbox). For SQS, use a deduplication key stored in Redis with TTL.

---

## 4. Data Structures for System Design

Beyond arrays and hash maps, system design leverages specialized probabilistic, tree-based, and distributed data structures to solve specific problems at scale.

### 4.1 Consistent Hashing

Hash both data keys and server nodes onto the same virtual ring. Each key is assigned to the first server clockwise from its hash position.

- **Adding a node**: Only keys between the new node and its predecessor are remapped — O(K/N) keys move
- **Removing a node**: Only that node's keys are redistributed to the next node on the ring
- **Virtual nodes (vnodes)**: Each physical node owns multiple ring positions for better load balance
- **Used by**: Amazon DynamoDB, Apache Cassandra, Memcached, HAProxy, CDN routing

### 4.2 Bloom Filter

Space-efficient probabilistic set structure. Answers 'is X in the set?' with no false negatives and a configurable false positive rate.

- **How it works**: k hash functions map an element to k positions in a bit array. Lookup checks all k bits
- **False positives**: Possible (~1% configurable). **False negatives**: impossible
- **Space**: ~10 bits per element for 1% FP rate — vs O(n) bytes for full set storage
- **Deletes**: Not supported in basic Bloom filter. Use Counting Bloom Filter or Cuckoo Filter

**System Design Applications:**

- Cassandra SSTables: Bloom filter per SSTable to skip disk reads for non-existent keys
- Cache penetration: Reject requests for keys that can never exist before hitting cache or DB
- Web crawlers: Detect already-visited URLs without storing all URLs in memory
- CDN: Identify one-hit-wonder content to avoid polluting the cache

> **Interview Tip**
> 'How do you check membership in a 100M-item set with minimal memory?' -> Bloom filter. Follow-up: Counting Bloom Filter supports deletes. Cuckoo Filter is an alternative with better lookup performance and delete support.

### 4.3 HyperLogLog

Probabilistic cardinality estimator. Counts distinct elements using O(1) space (~12 KB) with ~0.81% standard error — regardless of the size of the set.

- **Problem it solves**: Count unique visitors / daily active users when the exact count is not needed
- **Redis commands**: `PFADD` to add elements, `PFCOUNT` to get estimate, `PFMERGE` to combine HLLs
- **Space advantage**: Counting 1M vs 1B distinct IDs uses the same ~12 KB of memory
- **Used by**: Google Analytics, database query planners (cardinality estimation for query optimization)

> **Interview Tip**
> When asked 'how do you count unique users per day across 1 billion requests?': HyperLogLog in Redis. PFADD each user ID; PFCOUNT returns the estimate. Merge multiple HLLs for range queries (last 7 days). This is a very common interview question.

### 4.4 Skip List

Probabilistic sorted data structure with O(log n) average search, insert, delete. Simpler to implement than balanced BSTs and easier to make lock-free for concurrent access.

- **Structure**: Layered linked lists. Upper layers act as express lanes for fast navigation
- **Used by**: Redis Sorted Sets (ZSET) — leaderboards, sliding-window rate limiting, range queries
- **Advantage**: Lock-free concurrent implementations are much simpler than for tree structures

### 4.5 B+ Tree

Self-balancing tree where each node holds multiple keys and child pointers. The default index structure for every major RDBMS.

- **B+ Tree property**: All data lives in leaf nodes; leaf nodes are linked as a doubly-linked list for range scans
- **Height**: Typically 3-4 levels for millions of records — only 3-4 disk I/Os per lookup
- **Range queries**: Traverse linked leaf nodes — O(log n + k) where k = result set size
- **Used by**: PostgreSQL, MySQL, SQLite indexes; filesystem structures (ext4, NTFS, APFS)

### 4.6 LSM-Tree (Log-Structured Merge-Tree)

Optimized for write-heavy workloads. Converts random writes into sequential writes by buffering in memory and batch-flushing sorted files to disk.

- **Memtable**: In-memory sorted write buffer. All writes land here first — extremely fast
- **SSTable**: Immutable sorted file on disk. Memtable flushed to SSTable when full
- **Compaction**: Background process merges SSTables, purges deleted keys, maintains sorted order
- **Read path**: Check memtable, then SSTables newest-to-oldest. Bloom filters skip irrelevant files
- **Used by**: Apache Cassandra, RocksDB, LevelDB, InfluxDB, HBase

> **Interview Tip — LSM vs B-Tree**
> LSM: better write throughput (sequential I/O), worse read performance (may read multiple files). B-Tree: better reads (random I/O optimized by OS page cache), worse write amplification. Cassandra (LSM) = write-optimized. PostgreSQL (B-Tree) = read-optimized. This is the core storage trade-off.

### 4.7 Trie (Prefix Tree)

Tree where each path from root to leaf represents a string. Optimal for prefix search, autocomplete, and IP routing.

- **Lookup / Insert**: O(L) where L = key length — independent of total number of keys
- **Autocomplete**: Find all keys with a prefix by traversing to the prefix node, then BFS
- **Radix Tree**: Compressed Trie that merges single-child chains. Used in HTTP routers (Gin, Fastify, Express)
- **Used by**: DNS resolvers, IP routing (longest-prefix match), search autocomplete, spell checkers

### 4.8 Inverted Index

Maps from terms (words) to the list of documents containing them. The core data structure behind all search engines.

- **Structure**: term -> [(docId, positions, tf-idf score), ...]
- **Construction**: Tokenize documents, normalize terms (lowercase, stem), build posting lists
- **Query execution**: AND: intersect posting lists. OR: union. Phrase: proximity intersection
- **Used by**: Elasticsearch, Apache Solr, PostgreSQL full-text search (tsvector / tsquery)

### 4.9 Quick Reference

| Structure | Complexity | Space | Key System Design Use Case |
| --- | --- | --- | --- |
| Hash Map | O(1) avg get/set | O(n) | Caching, deduplication, routing tables |
| Consistent Hashing | O(log n) lookup | O(n) | Distributed cache shard routing, DynamoDB, Cassandra |
| Bloom Filter | O(k) insert/lookup | O(m) bits | Membership testing, cache penetration prevention |
| HyperLogLog | O(1) add/count | ~12 KB fixed | Unique visitor counting, cardinality estimation |
| Skip List | O(log n) | O(n log n) | Redis sorted sets, leaderboards, sliding-window rate limits |
| B+ Tree | O(log n) | O(n) | RDBMS indexes, filesystem structures, range queries |
| LSM-Tree | O(1) write, O(log n) read | O(n) | Write-heavy DBs: Cassandra, RocksDB, HBase |
| Trie / Radix Tree | O(L) — key length | O(alphabet * n) | Autocomplete, IP routing, HTTP router dispatch |
| Inverted Index | O(1) term lookup | O(terms * n) | Full-text search: Elasticsearch, PostgreSQL FTS |

---

## 5. Interview Decision Framework

When asked a system design question, use this structured approach to select the right components with confident trade-off justifications.

### 5.1 Database Selection

- **Clear relationships + ACID required?** → Relational DB (PostgreSQL, Aurora)
- **Variable schema / document-shaped data?** → Document store (MongoDB)
- **Millions of writes per second?** → Wide-column (Cassandra) or LSM-backed DB
- **Relationships are the query (social, fraud)?** → Graph DB (Neo4j, Neptune)
- **Time-ordered metrics / sensor data?** → Time-series DB (InfluxDB, TimescaleDB)
- **Full-text search needed?** → Elasticsearch as secondary store, synced via CDC or Kafka
- **Need SQL but at global scale?** → NewSQL (CockroachDB, Spanner)

### 5.2 Caching Strategy

- **Read-heavy, mostly static data?** → Cache-aside with generous TTL
- **Consistency critical, moderate writes?** → Write-through cache
- **Write throughput is the bottleneck?** → Write-behind (accept eventual consistency risk)
- **Cold starts are intolerable?** → Refresh-ahead with predictive prefetch
- **Sessions or short-lived state?** → Redis with TTL eviction
- **Hot key stampede risk?** → Mutex pattern + probabilistic early refresh + TTL jitter

### 5.3 Queue / Streaming Selection

- **Need replay, audit log, or multiple independent consumers?** → Kafka or Kinesis
- **Complex routing / exchange logic?** → RabbitMQ
- **Fully managed, serverless-friendly?** → SQS (Standard or FIFO)
- **Strict ordering within an entity?** → Kafka with key-based partitioning
- **Exactly-once for financial transactions?** → Kafka transactional API + idempotent consumers
- **Simple fire-and-forget task queue?** → SQS Standard or Redis LPUSH/BRPOP

### 5.4 Data Structure Selection

- **Membership test with minimal memory?** → Bloom filter
- **Count distinct elements at scale?** → HyperLogLog
- **Sorted scores / ranked leaderboard?** → Redis sorted set (skip list internally)
- **Prefix search / autocomplete?** → Trie or Radix Tree
- **Full-text search?** → Inverted index (Elasticsearch)
- **Distributed key routing?** → Consistent hashing
- **Write-optimized embedded storage?** → LSM-tree (RocksDB / LevelDB)

> **Final Interview Tip**
> Always justify choices with explicit trade-offs: *"I chose X because it gives us Y, but this means we accept Z."* Start with the simplest solution, then add complexity only when the interviewer pushes on scale, failure scenarios, or cost. The best answers are conversations, not recitations.
