# Data Structures for System Design

Beyond basic arrays and hash maps, system design leverages specialized probabilistic, tree-based, and distributed data structures to solve specific problems at massive scale.

---

## 1. Consistent Hashing

- Hashes both data keys and server nodes onto the same virtual ring.
- Each key is assigned to the first server clockwise from its hash position.
- When adding a node, only the keys between the new node and its predecessor are remapped, moving just O(K/N) keys rather than reshuffling everything.
- Virtual nodes (vnodes) assign multiple ring positions to a single physical node for better load balancing.
- Used by Amazon DynamoDB, Apache Cassandra, Memcached, HAProxy, and CDN routing.

---

## 2. Bloom Filter

- A space-efficient probabilistic set structure that answers "is X in the set?".
- Guarantees no false negatives, but has a configurable false positive rate (e.g., ~1%).
- Uses k hash functions to map an element to k positions in a bit array. Lookups check if all k bits are set.
- A basic Bloom filter does not support deletes; use a Counting Bloom Filter or a Cuckoo Filter instead.
- Frequently used to prevent cache penetration and to check membership in massive sets (100M+ items) using very little memory.

---

## 3. HyperLogLog

- A probabilistic cardinality estimator used to count distinct elements.
- Solves the problem of counting unique visitors or daily active users when an exact count is not strictly necessary.
- Operates in O(1) space (fixed ~12 KB) with a standard error of ~0.81%, meaning it takes the same memory to count 1 million distinct IDs as 1 billion.
- Redis utilizes this via `PFADD` and `PFCOUNT` commands.

---

## 4. Skip List

- A probabilistic sorted data structure providing O(log n) average time for search, insert, and delete operations.
- Utilizes layered linked lists where the upper layers act as express lanes for fast navigation.
- Much simpler to implement and make lock-free for concurrent access compared to balanced Binary Search Trees.
- The underlying structure used by Redis Sorted Sets (ZSET) for leaderboards and sliding-window rate limiting.

---

## 5. B+ Tree

- A self-balancing tree where each node holds multiple keys and child pointers.
- The default index structure for every major RDBMS.
- All data lives exclusively in the leaf nodes, and these leaf nodes are linked together as a doubly-linked list to optimize range scans.
- The backbone of PostgreSQL, MySQL, and filesystem structures like ext4 and APFS.

---

## 6. LSM-Tree (Log-Structured Merge-Tree)

- Highly optimized for write-heavy workloads, converting random writes into sequential writes.
- Writes first land in an extremely fast, in-memory sorted buffer called a **Memtable**.
- Once the Memtable is full, it flushes to an immutable sorted file on disk known as an **SSTable**.
- A background compaction process merges these SSTables.
- Reads check the Memtable first, then SSTables from newest to oldest, relying on Bloom filters to skip irrelevant files.
- **Interview Tip**: The core storage trade-off: LSM-trees (Cassandra) provide better write throughput, whereas B-Trees (PostgreSQL) provide better read performance.

---

## 7. Trie (Prefix Tree)

- A tree where each path from the root to a leaf represents a string.
- Optimal for prefix searches, autocomplete functions, and IP routing.
- Lookup and insert complexity is O(L), where L is the length of the key, independent of the total number of keys stored.
- A Radix Tree is a compressed version that merges single-child chains, frequently used in HTTP routers.

---

## 8. Inverted Index

- Maps terms (words) to the list of documents that contain them.
- The core data structure behind all search engines, such as Elasticsearch and Apache Solr.
- Query execution works by intersecting posting lists for AND queries, or unioning them for OR queries.
