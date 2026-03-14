# Caching Strategies

Caching is fundamentally about storing the results of expensive computations or I/O operations close to where they are actually needed. To design a robust system, you must understand cache placement, population strategies, and eviction policies.

---

## 1. Cache Placement Tiers

Where you place the cache impacts latency, data consistency, and architectural complexity. A typical data flow pattern routes requests through a CDN, to an API Gateway, into an L1 in-process cache, then an L2 distributed cache (like Redis), and finally to the database.

### Client-Side

- **Browser Cache**: Built directly into web browsers and utilizes HTTP headers like `Cache-Control`, `ETag`, and `Last-Modified`. It is completely free to use.
- **CDN Edge Cache**: Content Delivery Networks (like Cloudflare or CloudFront) push static and dynamic assets to global edge servers, delivering single-digit millisecond latency.

### In-Process / Local

- In-memory maps (like Guava Cache for Java or lru-cache for Node.js) that offer the fastest possible retrieval because there is no network hop.
- **Trade-off**: The cache is not shared across application instances, meaning each pod or server maintains its own potentially stale copy of the data.

### Distributed Cache

- **Redis**: The most popular choice, offering cluster modes for horizontal scaling, optional persistence, and rich data types.
- **Memcached**: A simpler, multi-threaded cache that operates strictly on a Least Recently Used (LRU) basis. It lacks persistence, sorted sets, and pub/sub capabilities.
- **Hazelcast**: An in-memory data grid popular in the Java ecosystem that allows computing near the data.

---

## 2. Cache Population Strategies

These strategies dictate how and when data is written to the cache.

### Cache-Aside (Lazy Loading)

The application checks the cache first; if there is a miss, it reads from the database and then populates the cache.

- This is the most common pattern.
- It only caches requested data, and a cache failure won't break read operations.
- However, it suffers from a "cold-start" penalty and can cause a thundering herd problem when hot keys expire.

### Write-Through

Every write operation updates both the cache and the database synchronously.

- Ensures the cache is never stale.
- However, it doubles write latency and may end up caching data that is never actually read.

### Write-Behind (Write-Back)

The application writes strictly to the cache, which then asynchronously flushes the data to the database after a delay.

- Offers the lowest write latency and allows for batched database writes.
- Major risk is data loss if the cache crashes before flushing, leading to temporary database inconsistency.

### Read-Through

The cache sits directly in front of the database and manages cache misses itself, allowing the application to only communicate with the cache layer.

- Simplifies application code.
- However, the initial read is always slow, and the cache library must be compatible with your data sources.

### Refresh-Ahead

The cache proactively refreshes its entries before they expire based on predicted access patterns.

- Provides zero miss latency for frequently accessed data.
- Complex to implement and risks caching unread data.

---

## 3. Eviction Policies

When a cache fills up, it needs rules to decide which data to remove.

- **LRU (Least Recently Used)**: Evicts the item that hasn't been accessed for the longest period; the standard default for general workloads.
- **LFU (Least Frequently Used)**: Evicts the item with the lowest total number of accesses, ideal for skewed or Zipfian access patterns.
- **FIFO (First In First Out)**: Evicts the oldest item inserted, regardless of how often it's accessed.
- **TTL (Time-To-Live)**: Automatically evicts items after a fixed amount of time has passed since insertion.
- **Random**: Evicts a random item, providing a very low-overhead approximation of LRU.
- **MRU (Most Recently Used)**: Evicts the most recently accessed item, useful for large sequential reads or cyclic scans.

---

## 4. Cache Failure Patterns

Mentioning these failure patterns unprompted during an interview is a strong indicator of real-world production experience.

### Cache Stampede (Thundering Herd)

Occurs when a highly popular key expires, causing many concurrent requests to miss the cache simultaneously and all hit the database at once.

- **Solutions**: Implement a mutex pattern (only one request rebuilds the cache while others wait), use probabilistic early recomputation, or add random TTL jitter to spread out expirations.

### Cache Penetration

Happens when users request keys that do not exist, causing the requests to constantly bypass the cache and overwhelm the database.

- **Solutions**: Cache null or empty results with a short TTL, or implement a Bloom filter to reject invalid keys outright.

### Cache Avalanche

Occurs when a large number of cache keys expire at the exact same time, flooding the database with requests.

- **Solutions**: Stagger your TTLs using random jitter and implement circuit breakers on your database connections.

---

## 5. Distributed Cache Internals

- **Consistent Hashing**: A technique used to distribute keys across multiple cache nodes. If a node is added or removed, it only requires remapping approximately `1/N` of the keys, rather than reshuffling the entire cache.
- **Redis Cluster vs. Sentinel**: Redis Cluster divides data across 16,384 hash slots with automatic rebalancing, requiring at least 3 primary nodes. Redis Sentinel provides High Availability (HA) without clustering by monitoring the primary node and promoting a replica if a failure occurs.
- **Event-based Invalidation**: When the database is written to, an invalidation event is published, prompting consumers to delete the corresponding stale cache keys.
