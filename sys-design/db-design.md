# Database Design

Choosing the right database is one of the most critical decisions in system design. Each category has distinct trade-offs regarding consistency, scalability, query flexibility, and operational complexity.

---

## 1. Relational Databases (RDBMS)

Relational databases store data in structured tables using predefined schemas, linking data through relationships called foreign keys. They provide strong consistency and are fully ACID compliant.

- **ACID**: Stands for Atomicity, Consistency, Isolation, and Durability, which guarantees that transactions are processed in an "all-or-nothing" manner.
- **SQL**: The standard language used to interact with RDBMS, supporting complex joins, aggregations, window functions, and transactions.
- **Normalization**: The process of organizing data to reduce duplication and enforce referential integrity.
- **Scaling Strategy**: The standard approach is to scale vertically first, followed by adding read replicas. Horizontal sharding should be a last resort as it breaks SQL joins and adds application-layer complexity.
- **Primary Examples**: PostgreSQL (known for JSONB support and extensions like PostGIS), MySQL (battle-tested in LAMP stacks), and Amazon Aurora (offers up to 5x throughput with managed failover).

---

## 2. Document Stores

Document stores are schema-flexible databases that save data as semi-structured JSON or BSON documents. Every document within a collection can have completely different fields.

- **Use Cases**: Ideal for hierarchical data, frequently evolving schemas, or when the shape of entities varies (like content catalogs or user profiles).
- **Trade-offs**: Relying on denormalization can lead to update anomalies. Cross-document transactions are also expensive.
- **Primary Examples**: MongoDB (features a rich aggregation pipeline and built-in sharding) and Couchbase (includes an in-memory caching layer for low-latency reads, making it good for mobile-sync workloads).

---

## 3. Key-Value Stores

This is the simplest database model, functioning as a distributed hash map. They offer extremely fast lookups but have very limited querying capabilities.

- **Use Cases**: They form the backbone of caching and session storage.
- **Primary Examples**: Redis (an in-memory store with rich data types like lists, sets, and streams), DynamoDB (an AWS-managed, serverless database offering single-digit millisecond latency), and Memcached (a simpler, multi-threaded pure LRU cache with no persistence).

---

## 4. Wide-Column Stores

In wide-column stores, rows can contain thousands of columns grouped into column families. They are optimized for high write throughput across distributed nodes and time-ordered range scans.

- **Data Modeling**: Tables are designed specifically around access patterns and queries rather than data normalization.
- **Use Cases**: Best for IoT sensor data, activity feeds, and write-heavy workloads at a massive scale.
- **Primary Examples**: Cassandra (features a masterless ring, linear horizontal scalability, and tunable consistency) and HBase (built on HDFS with strong consistency).

---

## 5. Graph Databases

These databases model data as nodes (representing entities) and edges (representing relationships).

- **Performance**: Multi-hop relationship traversals operate at O(log n) time complexity, which avoids the exponential cost of recursive SQL joins.
- **Use Cases**: Use them when the relationships between data points are just as important as the data itself, such as in social graphs, fraud detection, or recommendation engines.
- **Primary Examples**: Neo4j (ACID-compliant using the Cypher query language) and Amazon Neptune (supports Gremlin and SPARQL).

---

## 6. Time-Series Databases

Time-series databases are append-heavy and heavily optimized for sequential writes and time-based range queries. They compress temporal data using delta encoding.

- **Use Cases**: Standard for metrics, monitoring, telemetry, and events.
- **Primary Examples**: InfluxDB (purpose-built with retention policies and continuous queries), TimescaleDB (a PostgreSQL extension offering full SQL capabilities), and Prometheus (pull-based metrics collection standard in Kubernetes).

---

## 7. NewSQL & Search

- **NewSQL**: Databases like CockroachDB and Google Spanner offer the strong consistency (ACID) of relational databases combined with horizontal scalability via distributed consensus protocols like Paxos or Raft. A trade-off is higher latency due to coordination.
- **Search**: Engines like Elasticsearch and Solr use an inverted index data structure to provide near real-time full-text search and log analytics.

---

## 8. The CAP Theorem

The CAP Theorem states that a distributed system cannot simultaneously guarantee Consistency, Availability, and Partition Tolerance. Because network partitions will inevitably occur in the real world, the practical architectural choice is always between:

- **CP** (Consistency + Partition Tolerance)
- **AP** (Availability + Partition Tolerance)
