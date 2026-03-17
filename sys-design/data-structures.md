# Data Structures for System Design

System design interviews require knowledge of both **conventional data structures** (hash tables, heaps, queues) and **specialized structures** (Bloom filters, LSM-trees, consistent hashing) that power production systems at massive scale. This guide covers both, with real-world use cases and examples for each.

---

## 1. Hash Table (Hash Map)

- The most fundamental key-value structure: maps keys to values via a hash function in O(1) average time.
- The backbone of caches, session stores, database indexes (hash indexes), and configuration lookups.
- **Collision handling**: Open addressing (linear/quadratic probing) or chaining (linked lists per bucket).
- **Resizing**: When the load factor exceeds a threshold (~0.75), the table doubles in size and rehashes all keys — an O(n) operation amortized across inserts.

### Real-World Use Cases
- **In-memory caches**: Every in-process cache (Guava, lru-cache) is a hash map with eviction.
- **Database hash indexes**: PostgreSQL hash indexes for equality-only lookups (no range scans).
- **Load balancer session affinity**: Map session IDs to backend servers.
- **Deduplication**: Store seen message IDs to prevent double-processing in consumers.
- **Rate limiting**: Map client IPs to request counters with TTL.

### Example: API Rate Limiter
```
hash_map = {
  "client_192.168.1.1": { count: 45, window_start: 1710000000 },
  "client_10.0.0.5":    { count: 99, window_start: 1710000000 }
}
# O(1) lookup per request → check if count < limit
```

---

## 2. Array & Dynamic Array

- Contiguous memory block with O(1) random access by index.
- Dynamic arrays (ArrayList, Vec, std::vector) automatically resize with amortized O(1) append.
- Cache-friendly due to memory locality — critical for performance-sensitive paths.

### Real-World Use Cases
- **Ring buffers / Circular buffers**: Fixed-size arrays for streaming data — used in network packet buffers, audio processing, and log collection agents.
- **Time-series buckets**: Pre-allocate arrays for fixed time windows (e.g., 60 slots for per-second counters in a sliding-window rate limiter).
- **Batch processing**: Accumulate records into arrays before bulk-inserting into databases or sending to Kafka.
- **Columnar storage**: Column-oriented databases (Parquet, ClickHouse) store each column as a contiguous array for vectorized SIMD operations.

### Example: Sliding Window Counter
```
# 60-second sliding window using a circular buffer
counters = [0] * 60  # one slot per second
current_second = timestamp % 60
counters[current_second] += 1
total_last_minute = sum(counters)
```

---

## 3. Linked List

- Sequential nodes where each node points to the next (singly) or both next and previous (doubly).
- O(1) insertion/deletion at known positions, but O(n) random access.

### Real-World Use Cases
- **LRU cache internals**: A doubly-linked list + hash map implements O(1) LRU eviction — the exact approach used by Redis, Memcached, and Linux page cache.
- **Memory allocators**: Free lists in malloc/jemalloc track available memory blocks as linked lists.
- **Undo/redo stacks**: Each operation node links to the previous state.
- **OS process scheduling**: Linux's CFS scheduler uses linked-list run queues.
- **Blockchain**: Each block contains a hash pointer to the previous block, forming a cryptographic linked list.

### Example: LRU Cache (Hash Map + Doubly Linked List)
```
GET key →
  1. hash_map[key] → node in linked list    O(1)
  2. Move node to head (most recently used)  O(1)

EVICT →
  1. Remove tail node (least recently used)  O(1)
  2. Delete from hash_map                    O(1)
```

---

## 4. Stack & Queue

### Stack (LIFO)
- Push/pop from one end in O(1). Fundamental to function call stacks, expression parsing, and backtracking algorithms.

### Queue (FIFO)
- Enqueue at the back, dequeue from the front in O(1).

### Real-World Use Cases
- **Message queues**: RabbitMQ, SQS, and Redis lists (LPUSH/BRPOP) are distributed FIFO queues.
- **Task scheduling**: Worker pools pull tasks from queues — Celery, Sidekiq, Bull.
- **BFS in graph traversal**: Used in social-graph friend suggestions, shortest-path in network routing.
- **Undo operations**: Editors (VS Code, Google Docs) maintain an undo stack of operations.
- **Call stack / recursion**: Every function call pushes a frame; every return pops one.
- **Request buffering**: Web servers (Nginx) queue incoming connections when all workers are busy.

### Priority Queue / Heap
- A binary heap provides O(log n) insert and O(1) peek at the min/max element.
- **Use cases**:
  - **Job schedulers**: Cron-like systems pull the next-due job from a min-heap keyed by execution time.
  - **Dijkstra's algorithm**: Shortest-path routing in network graphs and CDN path selection.
  - **Top-K problems**: Maintain a min-heap of size K to track the K largest elements in a stream (e.g., top trending hashtags).
  - **Merge K sorted streams**: Used in LSM-tree compaction to merge multiple SSTables.
  - **OS process scheduling**: Priority-based scheduling uses heaps to select the highest-priority process.

### Example: Delayed Job Queue with Min-Heap
```
heap = MinHeap()
heap.push((execute_at=1710003600, job="send_email_123"))
heap.push((execute_at=1710003500, job="resize_image_456"))

# Worker loop: peek at root, execute if time has come
while heap.peek().execute_at <= now():
    job = heap.pop()
    execute(job)
```

---

## 5. Tree Structures (Binary Search Tree, AVL, Red-Black)

- Balanced BSTs maintain O(log n) search, insert, and delete by rebalancing after mutations.
- **Red-Black Trees**: Used internally by Java's TreeMap, C++ std::map, and Linux's CFS scheduler.
- **AVL Trees**: Stricter balancing than Red-Black — faster lookups but slower inserts. Used in database in-memory indexes where reads dominate.

### Real-World Use Cases
- **In-memory database indexes**: Redis internals use various tree structures.
- **File system directory structure**: Directories form a tree; lookups traverse the path.
- **Interval trees**: Used in calendar/scheduling systems to find overlapping time ranges.
- **Syntax trees (AST)**: Compilers and linters parse code into abstract syntax trees.

---

## 6. Graph

- Vertices (nodes) connected by edges (directed or undirected, weighted or unweighted).
- Representations: adjacency list (sparse graphs) or adjacency matrix (dense graphs).

### Real-World Use Cases
- **Social networks**: Friend/follower relationships — Facebook uses TAO (graph-serving system).
- **Recommendation engines**: "Users who bought X also bought Y" via collaborative filtering on purchase graphs.
- **Dependency resolution**: Package managers (npm, pip) resolve dependency graphs with topological sort.
- **Network routing**: OSPF and BGP use shortest-path algorithms on network topology graphs.
- **Fraud detection**: Detect cycles and unusual patterns in transaction graphs (Neo4j, Amazon Neptune).
- **Microservice dependency maps**: Trace service-to-service call graphs for reliability planning.

---

## 7. Consistent Hashing

- Hashes both data keys and server nodes onto the same virtual ring.
- Each key is assigned to the first server clockwise from its hash position.
- When adding a node, only the keys between the new node and its predecessor are remapped, moving just O(K/N) keys rather than reshuffling everything.
- Virtual nodes (vnodes) assign multiple ring positions to a single physical node for better load balancing.

### Real-World Use Cases
- **Amazon DynamoDB**: Partitions data across storage nodes using consistent hashing with virtual nodes.
- **Apache Cassandra**: Token ring assigns each node a range of the hash space.
- **Memcached clusters**: Clients use consistent hashing to route keys to the correct cache server.
- **CDN routing**: Akamai and Cloudflare route requests to edge servers based on content hash.
- **Discord**: Routes messages to the correct server handling a given channel using consistent hashing.

### Example: Adding a Node
```
Before: Nodes [A, B, C] on ring → Key "user:123" (hash=5500) → Node C
After:  Add Node D at position 5000
        Key "user:123" (hash=5500) → Node D  (only keys 4001-5000 remapped)
        All other keys remain on their existing nodes
```

---

## 8. Bloom Filter

- A space-efficient probabilistic set structure that answers "is X in the set?".
- Guarantees no false negatives, but has a configurable false positive rate (e.g., ~1%).
- Uses k hash functions to map an element to k positions in a bit array. Lookups check if all k bits are set.
- A basic Bloom filter does not support deletes; use a Counting Bloom Filter or a Cuckoo Filter instead.

### Real-World Use Cases
- **Cache penetration prevention**: Check if a key could exist before hitting the database — used by CDNs and API gateways.
- **LSM-tree read optimization**: Cassandra, RocksDB, and LevelDB attach a Bloom filter to each SSTable to skip files that definitely don't contain a key.
- **Web crawlers**: Google's crawler uses Bloom filters to avoid re-crawling already-visited URLs.
- **Spell checkers**: Check if a word is in the dictionary without loading the entire dictionary into memory.
- **Network security**: Firewalls use Bloom filters for fast IP blacklist lookups.
- **Bitcoin SPV nodes**: Lightweight clients use Bloom filters to request only relevant transactions from full nodes.

### Example: Cache Penetration Guard
```
bloom = BloomFilter(expected_items=100_000_000, fp_rate=0.01)
# Populate with all valid user IDs on startup

def get_user(user_id):
    if not bloom.might_contain(user_id):
        return None  # Definitely doesn't exist — skip DB
    return cache.get(user_id) or db.query(user_id)
```

---

## 9. HyperLogLog

- A probabilistic cardinality estimator used to count distinct elements.
- Solves the problem of counting unique visitors or daily active users when an exact count is not strictly necessary.
- Operates in O(1) space (fixed ~12 KB) with a standard error of ~0.81%, meaning it takes the same memory to count 1 million distinct IDs as 1 billion.
- Redis utilizes this via `PFADD` and `PFCOUNT` commands.

### Real-World Use Cases
- **Unique visitor counting**: Google Analytics and similar platforms count unique page views per URL.
- **Database query optimization**: PostgreSQL uses HLL for `COUNT(DISTINCT ...)` approximations on large tables.
- **Network monitoring**: Count unique source IPs hitting a service for DDoS detection.
- **A/B testing**: Count unique users per experiment variant without storing all user IDs.
- **Ad-tech**: Count unique ad impressions per campaign across billions of events.

### Example: Counting Daily Active Users
```
# Redis commands
PFADD dau:2026-03-16 "user:abc123"
PFADD dau:2026-03-16 "user:def456"
PFADD dau:2026-03-16 "user:abc123"  # duplicate, not counted
PFCOUNT dau:2026-03-16  # → 2 (±0.81% error)

# Merge multiple days for weekly count
PFMERGE wau:2026-w11 dau:2026-03-10 dau:2026-03-11 ... dau:2026-03-16
PFCOUNT wau:2026-w11  # Weekly active users
```

---

## 10. Skip List

- A probabilistic sorted data structure providing O(log n) average time for search, insert, and delete operations.
- Utilizes layered linked lists where the upper layers act as express lanes for fast navigation.
- Much simpler to implement and make lock-free for concurrent access compared to balanced Binary Search Trees.

### Real-World Use Cases
- **Redis Sorted Sets (ZSET)**: The primary structure for leaderboards, priority queues, and sliding-window rate limiting.
- **LevelDB / RocksDB MemTable**: Some configurations use skip lists as the in-memory write buffer.
- **Concurrent data structures**: Lock-free skip lists in Java's ConcurrentSkipListMap for high-throughput concurrent access.
- **Time-windowed aggregation**: Store timestamped events in sorted order for efficient range queries.

### Example: Gaming Leaderboard
```
# Redis ZSET backed by skip list
ZADD leaderboard 15000 "player:alice"
ZADD leaderboard 12000 "player:bob"
ZADD leaderboard 18500 "player:charlie"

# Top 10 players — O(log n + 10)
ZREVRANGE leaderboard 0 9 WITHSCORES

# Player rank — O(log n)
ZREVRANK leaderboard "player:bob"  # → 2 (0-indexed)
```

---

## 11. B+ Tree

- A self-balancing tree where each node holds multiple keys and child pointers.
- The default index structure for every major RDBMS.
- All data lives exclusively in the leaf nodes, and these leaf nodes are linked together as a doubly-linked list to optimize range scans.
- High fan-out (hundreds of keys per node) means 3-4 levels can index billions of rows.

### Real-World Use Cases
- **PostgreSQL / MySQL indexes**: The default index type. A table with 1 billion rows typically needs only 3-4 B+ tree levels — meaning any lookup is 3-4 disk I/Os.
- **File systems**: ext4, APFS, NTFS, and Btrfs use B+ trees to map file names to inodes.
- **Database range queries**: The linked-list leaf structure enables efficient `WHERE age BETWEEN 20 AND 30` scans.
- **Clustered indexes**: InnoDB (MySQL) stores the entire row in the B+ tree leaf, making primary key lookups a single structure traversal.

### Example: Why B+ Trees Beat Hash Indexes for Databases
```
Query: SELECT * FROM users WHERE age BETWEEN 25 AND 35

B+ Tree index:  Find 25 in O(log n), then scan linked leaves → fast
Hash index:     Must hash every value 25, 26, ... 35 individually → slow
```

---

## 12. LSM-Tree (Log-Structured Merge-Tree)

- Highly optimized for write-heavy workloads, converting random writes into sequential writes.
- Writes first land in an extremely fast, in-memory sorted buffer called a **Memtable**.
- Once the Memtable is full, it flushes to an immutable sorted file on disk known as an **SSTable**.
- A background compaction process merges these SSTables.
- Reads check the Memtable first, then SSTables from newest to oldest, relying on Bloom filters to skip irrelevant files.

### Real-World Use Cases
- **Apache Cassandra**: Write-optimized distributed database for IoT, messaging, and time-series workloads.
- **RocksDB**: Embedded LSM-tree engine used by CockroachDB, TiKV (TiDB), and as MySQL's MyRocks storage engine.
- **LevelDB**: Google's lightweight embedded store, used in Chrome's IndexedDB and Bitcoin Core.
- **InfluxDB**: Time-series database uses a variant called TSM (Time-Structured Merge) tree.
- **Kafka Streams state stores**: RocksDB-backed local state stores for stream processing.

### Interview Tip
The core storage trade-off: LSM-trees (Cassandra) provide better write throughput, whereas B-Trees (PostgreSQL) provide better read performance. LSM-trees achieve this by batching writes sequentially, but reads may need to check multiple levels. Write amplification (rewriting data during compaction) is the main cost.

---

## 13. Trie (Prefix Tree)

- A tree where each path from the root to a leaf represents a string.
- Optimal for prefix searches, autocomplete functions, and IP routing.
- Lookup and insert complexity is O(L), where L is the length of the key, independent of the total number of keys stored.
- A Radix Tree (compressed trie) merges single-child chains, frequently used in HTTP routers.

### Real-World Use Cases
- **Search autocomplete**: Google search suggestions, IDE code completion, and command palettes (VS Code Ctrl+P).
- **IP routing tables**: Longest prefix matching in routers uses tries to find the most specific route for an IP address.
- **HTTP routers**: Go's `httprouter`, Rust's `actix-web`, and nginx use radix trees to match URL paths to handlers.
- **Spell checkers**: Suggest corrections by finding words within edit distance of the input.
- **DNS resolution**: Domain name lookups traverse a trie-like structure (com → example → www).
- **Phone directories**: T9 predictive text on old phones used a trie of dictionary words.

### Example: Autocomplete System
```
Trie contains: ["app", "apple", "application", "apt", "api"]

Search prefix "app" →
  Traverse: root → 'a' → 'p' → 'p'
  DFS from 'p' node → ["app", "apple", "application"]
  Return top-K by popularity score
```

---

## 14. Inverted Index

- Maps terms (words) to the list of documents that contain them.
- The core data structure behind all search engines.
- Query execution works by intersecting posting lists for AND queries, or unioning them for OR queries.

### Real-World Use Cases
- **Elasticsearch / Apache Solr**: Full-text search for e-commerce product catalogs, log analytics (ELK stack), and site search.
- **Database full-text indexes**: PostgreSQL's `tsvector`/`tsquery` and MySQL's `FULLTEXT` index use inverted indexes internally.
- **Code search**: GitHub code search, Sourcegraph, and grep.app index source code with inverted indexes.
- **Email search**: Gmail indexes email content for instant search across billions of messages.
- **Log analytics**: Splunk and Datadog index log lines for rapid keyword search across petabytes of logs.

### Example: Search Query Execution
```
Index:
  "distributed" → [doc1, doc3, doc7, doc12]
  "systems"     → [doc1, doc5, doc7, doc15]
  "design"      → [doc2, doc3, doc7, doc20]

Query: "distributed AND systems"
  → intersect([doc1,doc3,doc7,doc12], [doc1,doc5,doc7,doc15])
  → [doc1, doc7]

Query: "distributed OR design"
  → union([doc1,doc3,doc7,doc12], [doc2,doc3,doc7,doc20])
  → [doc1, doc2, doc3, doc7, doc12, doc20]
```

---

## 15. Bitmap Index

- A compact binary representation where each bit corresponds to a row and indicates whether a condition is true.
- Extremely efficient for columns with low cardinality (few distinct values) and for combining multiple conditions using bitwise AND/OR operations.

### Real-World Use Cases
- **OLAP databases**: ClickHouse, Apache Druid, and Oracle use bitmap indexes for analytical queries on columns like status, gender, or region.
- **Data warehouses**: Quickly answer "How many active premium users in the US?" by ANDing three bitmap indexes.
- **Permission systems**: Store user permissions as bitmasks — bitwise AND checks access in O(1).
- **Feature flags**: Represent which features are enabled for a user as a bitmap.

### Example: Analytical Query with Bitmaps
```
Column "status":  active=1100101, inactive=0011010
Column "region":  US=1010100, EU=0101001
Column "plan":    premium=1100000, free=0011101

Query: active AND US AND premium
  → 1100101 AND 1010100 AND 1100000
  → 1000000  (only row 0 matches)
```

---

## References

- [Designing Data-Intensive Applications — Martin Kleppmann](https://dataintensive.net/)
- [Redis Data Structures Documentation](https://redis.io/docs/data-types/)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [RocksDB Architecture Guide](https://github.com/facebook/rocksdb/wiki)
- [Google Research — HyperLogLog in Practice](https://research.google/pubs/pub40671/)
- [Bloom Filter Calculator](https://hur.st/bloomfilter/)
- [System Design Primer — donnemartin](https://github.com/donnemartin/system-design-primer)
