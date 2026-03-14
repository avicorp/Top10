import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SYS_DESIGN_DIR = path.join(ROOT, 'sys-design');
const OUT = path.resolve(import.meta.dirname, '..', 'src', 'data');

interface SysDesignSection {
  id: string;
  title: string;
  contentHtml: string;
  mermaidDiagrams: string[];
}

interface ExternalLink {
  label: string;
  url: string;
  context: string;
}

interface SysDesignTopic {
  id: string;
  slug: string;
  title: string;
  sections: SysDesignSection[];
  externalLinks: ExternalLink[];
}

const TOPIC_FILES: { file: string; id: string; slug: string }[] = [
  { file: 'caching-strategies.md', id: 'caching', slug: 'caching-strategies' },
  { file: 'data-structures.md', id: 'data-structures', slug: 'data-structures' },
  { file: 'db-design.md', id: 'db-design', slug: 'db-design' },
  { file: 'message-queues-event-streaming.md', id: 'message-queues', slug: 'message-queues' },
  { file: 'interview-decision-framework.md', id: 'decision-framework', slug: 'decision-framework' },
];

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

async function mdToHtml(md: string): Promise<string> {
  const result = await markdownProcessor.process(md);
  return String(result);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractMermaidBlocks(content: string): { cleaned: string; diagrams: string[] } {
  const diagrams: string[] = [];
  const cleaned = content.replace(/```mermaid\n([\s\S]*?)```/g, (_match, diagram: string) => {
    diagrams.push(diagram.trim());
    return ''; // Remove mermaid blocks from content
  });
  return { cleaned, diagrams };
}

function extractExternalLinks(content: string): ExternalLink[] {
  const links: ExternalLink[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({ label: match[1], url: match[2], context: '' });
  }
  return links;
}

function splitIntoSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split('\n');
  let currentTitle = '';
  let currentBody: string[] = [];
  let foundFirst = false;

  for (const line of lines) {
    // Match ## headings (with optional numbering like "## 1. Title")
    const headingMatch = line.match(/^## (.+)$/);
    if (headingMatch) {
      if (foundFirst && currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = headingMatch[1].replace(/^\d+\.\s*/, '').trim();
      currentBody = [];
      foundFirst = true;
    } else if (foundFirst) {
      currentBody.push(line);
    }
  }
  if (foundFirst && currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
  }
  return sections;
}

async function parseTopic(file: string, id: string, slug: string): Promise<SysDesignTopic> {
  const content = fs.readFileSync(path.join(SYS_DESIGN_DIR, file), 'utf-8');

  // Extract title from first line
  const titleLine = content.split('\n')[0];
  const title = titleLine.replace(/^#\s+/, '').trim();

  // Extract external links from raw content
  const externalLinks = extractExternalLinks(content);

  // Split into sections
  const rawSections = splitIntoSections(content);
  const sections: SysDesignSection[] = [];

  for (const raw of rawSections) {
    const { cleaned, diagrams } = extractMermaidBlocks(raw.body);
    const html = await mdToHtml(cleaned);
    sections.push({
      id: slugify(raw.title),
      title: raw.title,
      contentHtml: html,
      mermaidDiagrams: diagrams,
    });
  }

  return { id, slug, title, sections, externalLinks };
}

// Add mermaid diagrams that aren't in the source markdown
function addSupplementaryDiagrams(topics: SysDesignTopic[]) {
  const cachingTopic = topics.find(t => t.slug === 'caching-strategies');
  if (cachingTopic) {
    // Add cache placement flow diagram to first section
    const placementSection = cachingTopic.sections.find(s => s.id === 'cache-placement-tiers');
    if (placementSection) {
      placementSection.mermaidDiagrams.push(
        `graph LR
    Client[Client] --> CDN[CDN Edge]
    CDN --> GW[API Gateway]
    GW --> L1[L1 In-Process Cache]
    L1 --> L2[L2 Redis/Memcached]
    L2 --> DB[(Database)]
    style Client fill:#3b82f6,color:#fff
    style CDN fill:#8b5cf6,color:#fff
    style L1 fill:#f59e0b,color:#fff
    style L2 fill:#ef4444,color:#fff
    style DB fill:#22c55e,color:#fff`
      );
    }
    // Cache-aside sequence
    const populationSection = cachingTopic.sections.find(s => s.id === 'cache-population-strategies');
    if (populationSection) {
      populationSection.mermaidDiagrams.push(
        `sequenceDiagram
    participant App
    participant Cache
    participant DB
    Note over App,DB: Cache Miss Flow
    App->>Cache: GET key
    Cache-->>App: null (miss)
    App->>DB: SELECT * FROM ...
    DB-->>App: data
    App->>Cache: SET key = data
    Note over App,DB: Cache Hit Flow
    App->>Cache: GET key
    Cache-->>App: data (hit)`
      );
      populationSection.mermaidDiagrams.push(
        `graph TB
    subgraph "Write-Through (Sync)"
        WT_App[App] -->|write| WT_Cache[Cache]
        WT_Cache -->|sync write| WT_DB[(DB)]
    end
    subgraph "Write-Behind (Async)"
        WB_App[App] -->|write| WB_Cache[Cache]
        WB_Cache -.->|async flush| WB_DB[(DB)]
    end`
      );
    }
    // Cache stampede
    const failureSection = cachingTopic.sections.find(s => s.id === 'cache-failure-patterns');
    if (failureSection) {
      failureSection.mermaidDiagrams.push(
        `sequenceDiagram
    participant R1 as Request 1
    participant R2 as Request 2
    participant R3 as Request 3
    participant Cache
    participant DB
    Note over Cache: Hot key expires!
    R1->>Cache: GET (miss)
    R2->>Cache: GET (miss)
    R3->>Cache: GET (miss)
    R1->>DB: query
    R2->>DB: query
    R3->>DB: query
    Note over DB: Overloaded!
    Note over Cache,DB: Fix: Mutex lock
    R1->>Cache: GET (miss) + acquire lock
    R2->>Cache: GET (miss) → wait
    R1->>DB: query
    DB-->>R1: data
    R1->>Cache: SET
    R2->>Cache: GET (hit)`
      );
    }
  }

  const dsTopic = topics.find(t => t.slug === 'data-structures');
  if (dsTopic) {
    const consistentSection = dsTopic.sections.find(s => s.id === 'consistent-hashing');
    if (consistentSection) {
      consistentSection.mermaidDiagrams.push(
        `graph TD
    subgraph "Consistent Hashing Ring"
        direction TB
        Ring["Hash Ring (0 to 2^32)"]
        N1["Node A (pos: 1000)"]
        N2["Node B (pos: 4000)"]
        N3["Node C (pos: 7000)"]
        K1["Key X (hash: 500) → Node A"]
        K2["Key Y (hash: 2500) → Node B"]
        K3["Key Z (hash: 5500) → Node C"]
    end
    Ring --- N1 & N2 & N3
    K1 -.-> N1
    K2 -.-> N2
    K3 -.-> N3`
      );
    }
    const bloomSection = dsTopic.sections.find(s => s.id === 'bloom-filter');
    if (bloomSection) {
      bloomSection.mermaidDiagrams.push(
        `graph LR
    subgraph "Bloom Filter Insert"
        Element[Element X] --> H1[Hash₁] & H2[Hash₂] & H3[Hash₃]
        H1 --> B2[Bit 2 = 1]
        H2 --> B5[Bit 5 = 1]
        H3 --> B9[Bit 9 = 1]
    end
    subgraph "Bit Array"
        BA["0|0|1|0|0|1|0|0|0|1|0|0"]
    end`
      );
    }
    const lsmSection = dsTopic.sections.find(s => s.title.includes('LSM'));
    if (lsmSection) {
      lsmSection.mermaidDiagrams.push(
        `graph TD
    Write[Write] --> MT[Memtable - in memory]
    MT -->|full| SS1[SSTable L0]
    MT -->|full| SS2[SSTable L0]
    SS1 & SS2 -->|compaction| SS3[SSTable L1]
    SS3 -->|compaction| SS4[SSTable L2]
    Read[Read] --> MT
    Read -.-> SS1
    Read -.-> SS3
    style MT fill:#22c55e,color:#fff
    style Write fill:#3b82f6,color:#fff
    style Read fill:#f59e0b,color:#fff`
      );
    }
    const bplusSection = dsTopic.sections.find(s => s.title.includes('B+ Tree'));
    if (bplusSection) {
      bplusSection.mermaidDiagrams.push(
        `graph TD
    Root["[30 | 60]"] --> N1["[10 | 20]"] & N2["[40 | 50]"] & N3["[70 | 80]"]
    N1 --> L1["⟨5,8⟩"] & L2["⟨12,15,18⟩"] & L3["⟨22,25,28⟩"]
    N2 --> L4["⟨32,35⟩"] & L5["⟨42,45⟩"] & L6["⟨52,55⟩"]
    N3 --> L7["⟨62,65⟩"] & L8["⟨72,75⟩"] & L9["⟨82,85,90⟩"]
    L1 ---|linked| L2 ---|linked| L3 ---|linked| L4
    style Root fill:#3b82f6,color:#fff
    style N1 fill:#8b5cf6,color:#fff
    style N2 fill:#8b5cf6,color:#fff
    style N3 fill:#8b5cf6,color:#fff`
      );
    }
    const skipSection = dsTopic.sections.find(s => s.title.includes('Skip List'));
    if (skipSection) {
      skipSection.mermaidDiagrams.push(
        `graph LR
    subgraph "Skip List Layers"
        H3["Head L3"] --> N7_3["7"] --> T3["Tail"]
        H2["Head L2"] --> N3_2["3"] --> N7_2["7"] --> N12_2["12"] --> T2["Tail"]
        H1["Head L1"] --> N1_1["1"] --> N3_1["3"] --> N5_1["5"] --> N7_1["7"] --> N9_1["9"] --> N12_1["12"] --> T1["Tail"]
    end
    style H3 fill:#ef4444,color:#fff
    style H2 fill:#f59e0b,color:#fff
    style H1 fill:#22c55e,color:#fff`
      );
    }
  }

  const dbTopic = topics.find(t => t.slug === 'db-design');
  if (dbTopic) {
    // DB selection decision tree
    const rdbmsSection = dbTopic.sections.find(s => s.title.includes('Relational'));
    if (rdbmsSection) {
      rdbmsSection.mermaidDiagrams.push(
        `graph TD
    Start["What are your requirements?"] --> ACID{"Need ACID + relationships?"}
    ACID -->|Yes| RDB["Relational DB<br/>(PostgreSQL, MySQL)"]
    ACID -->|No| Schema{"Schema flexible?"}
    Schema -->|Yes| DOC["Document Store<br/>(MongoDB)"]
    Schema -->|No| WriteHeavy{"Write-heavy?"}
    WriteHeavy -->|Yes| WC["Wide-Column<br/>(Cassandra)"]
    WriteHeavy -->|No| Relationships{"Graph queries?"}
    Relationships -->|Yes| Graph["Graph DB<br/>(Neo4j)"]
    Relationships -->|No| TimeSeries{"Time-ordered data?"}
    TimeSeries -->|Yes| TS["Time-Series DB<br/>(InfluxDB)"]
    TimeSeries -->|No| Search{"Full-text search?"}
    Search -->|Yes| ES["Search Engine<br/>(Elasticsearch)"]
    style Start fill:#3b82f6,color:#fff
    style RDB fill:#22c55e,color:#fff
    style DOC fill:#8b5cf6,color:#fff
    style WC fill:#f59e0b,color:#fff
    style Graph fill:#ec4899,color:#fff
    style TS fill:#06b6d4,color:#fff
    style ES fill:#ef4444,color:#fff`
      );
    }
    // CAP theorem
    const capSection = dbTopic.sections.find(s => s.title.includes('CAP'));
    if (capSection) {
      capSection.mermaidDiagrams.push(
        `graph TD
    CAP["CAP Theorem"] --> C["Consistency<br/>Every read gets latest write"]
    CAP --> A["Availability<br/>Every request gets a response"]
    CAP --> P["Partition Tolerance<br/>System works despite network splits"]
    C & P --> CP["CP Systems<br/>MongoDB, HBase, Redis Cluster"]
    A & P --> AP["AP Systems<br/>Cassandra, DynamoDB, CouchDB"]
    style CAP fill:#3b82f6,color:#fff
    style CP fill:#8b5cf6,color:#fff
    style AP fill:#f59e0b,color:#fff`
      );
    }
    // RDBMS scaling
    const rdbmsSection2 = dbTopic.sections.find(s => s.title.includes('Relational'));
    if (rdbmsSection2 && rdbmsSection2.mermaidDiagrams.length < 2) {
      rdbmsSection2.mermaidDiagrams.push(
        `graph LR
    V["Vertical Scale"] --> RR["Read Replicas"]
    RR --> CP["Connection Pooling"]
    CP --> SH["Sharding"]
    style V fill:#22c55e,color:#fff
    style RR fill:#3b82f6,color:#fff
    style CP fill:#f59e0b,color:#fff
    style SH fill:#ef4444,color:#fff`
      );
    }
  }

  const mqTopic = topics.find(t => t.slug === 'message-queues');
  if (mqTopic) {
    const kafkaSection = mqTopic.sections.find(s => s.title.includes('Kafka'));
    if (kafkaSection) {
      kafkaSection.mermaidDiagrams.push(
        `graph TD
    P1[Producer] & P2[Producer] --> T["Topic: orders"]
    T --> Part0["Partition 0"] & Part1["Partition 1"] & Part2["Partition 2"]
    subgraph "Consumer Group A"
        C1["Consumer 1"] --> Part0
        C2["Consumer 2"] --> Part1
        C3["Consumer 3"] --> Part2
    end
    subgraph "Consumer Group B"
        C4["Consumer 4"] --> Part0 & Part1 & Part2
    end
    style T fill:#3b82f6,color:#fff
    style Part0 fill:#8b5cf6,color:#fff
    style Part1 fill:#8b5cf6,color:#fff
    style Part2 fill:#8b5cf6,color:#fff`
      );
    }
    const patternsSection = mqTopic.sections.find(s => s.title.includes('Messaging Patterns'));
    if (patternsSection) {
      patternsSection.mermaidDiagrams.push(
        `graph LR
    subgraph "Point-to-Point"
        PP_P[Producer] --> PP_Q[Queue]
        PP_Q --> PP_C1[Worker 1]
        PP_Q --> PP_C2[Worker 2]
    end
    subgraph "Pub-Sub"
        PS_P[Producer] --> PS_T[Topic]
        PS_T --> PS_G1[Group: Inventory]
        PS_T --> PS_G2[Group: Notifications]
        PS_T --> PS_G3[Group: Analytics]
    end`
      );
      patternsSection.mermaidDiagrams.push(
        `sequenceDiagram
    participant App
    participant DB
    participant Outbox
    participant Relay
    participant Queue
    participant Consumer
    App->>DB: BEGIN TX
    App->>DB: INSERT order
    App->>Outbox: INSERT event
    App->>DB: COMMIT
    Relay->>Outbox: Poll new events
    Relay->>Queue: Publish
    Queue->>Consumer: Deliver`
      );
    }
    const coreSection = mqTopic.sections.find(s => s.title.includes('Core Concepts'));
    if (coreSection) {
      coreSection.mermaidDiagrams.push(
        `graph LR
    P[Producer] -->|publish| B["Broker<br/>(Kafka/RabbitMQ)"]
    B -->|deliver| CG["Consumer Group"]
    CG -->|ACK| B
    B -->|failed msgs| DLQ["Dead Letter Queue"]
    CG -->|backpressure| P
    style B fill:#3b82f6,color:#fff
    style DLQ fill:#ef4444,color:#fff`
      );
    }
  }

  const dfTopic = topics.find(t => t.slug === 'decision-framework');
  if (dfTopic) {
    const dbSection = dfTopic.sections.find(s => s.title.includes('Database'));
    if (dbSection) {
      dbSection.mermaidDiagrams.push(
        `graph TD
    Q1{"ACID required?"} -->|Yes| RDB["PostgreSQL / Aurora"]
    Q1 -->|No| Q2{"Schema flexible?"}
    Q2 -->|Yes| DOC["MongoDB"]
    Q2 -->|No| Q3{"Millions writes/sec?"}
    Q3 -->|Yes| WC["Cassandra"]
    Q3 -->|No| Q4{"Graph queries?"}
    Q4 -->|Yes| GDB["Neo4j"]
    Q4 -->|No| Q5{"Time-series?"}
    Q5 -->|Yes| TSDB["InfluxDB / TimescaleDB"]
    Q5 -->|No| Q6{"Full-text search?"}
    Q6 -->|Yes| ES["Elasticsearch"]
    Q6 -->|No| Q7{"Global SQL scale?"}
    Q7 -->|Yes| NS["CockroachDB / Spanner"]
    style Q1 fill:#3b82f6,color:#fff`
      );
    }
    const cacheSection = dfTopic.sections.find(s => s.title.includes('Caching'));
    if (cacheSection) {
      cacheSection.mermaidDiagrams.push(
        `graph TD
    Q1{"Read-heavy, mostly static?"} -->|Yes| CA["Cache-Aside + TTL"]
    Q1 -->|No| Q2{"Consistency critical?"}
    Q2 -->|Yes| WT["Write-Through"]
    Q2 -->|No| Q3{"Write throughput bottleneck?"}
    Q3 -->|Yes| WB["Write-Behind"]
    Q3 -->|No| Q4{"Cold starts intolerable?"}
    Q4 -->|Yes| RA["Refresh-Ahead"]
    Q4 -->|No| Q5{"Hot key stampede risk?"}
    Q5 -->|Yes| MX["Mutex + TTL Jitter"]
    style Q1 fill:#8b5cf6,color:#fff`
      );
    }
    const queueSection = dfTopic.sections.find(s => s.title.includes('Queue'));
    if (queueSection) {
      queueSection.mermaidDiagrams.push(
        `graph TD
    Q1{"Need replay / audit?"} -->|Yes| KF["Kafka / Kinesis"]
    Q1 -->|No| Q2{"Complex routing?"}
    Q2 -->|Yes| RMQ["RabbitMQ"]
    Q2 -->|No| Q3{"Fully managed?"}
    Q3 -->|Yes| SQS["AWS SQS"]
    Q3 -->|No| Q4{"Simple task queue?"}
    Q4 -->|Yes| REDIS["Redis LPUSH/BRPOP"]
    style Q1 fill:#22c55e,color:#fff`
      );
    }
    const dsSection = dfTopic.sections.find(s => s.title.includes('Data Structure'));
    if (dsSection) {
      dsSection.mermaidDiagrams.push(
        `graph TD
    Q1{"Membership test?"} -->|Yes| BF["Bloom Filter"]
    Q1 -->|No| Q2{"Count distinct?"}
    Q2 -->|Yes| HLL["HyperLogLog"]
    Q2 -->|No| Q3{"Sorted ranking?"}
    Q3 -->|Yes| SL["Skip List / Redis ZSET"]
    Q3 -->|No| Q4{"Prefix search?"}
    Q4 -->|Yes| TR["Trie"]
    Q4 -->|No| Q5{"Full-text search?"}
    Q5 -->|Yes| II["Inverted Index"]
    Q5 -->|No| Q6{"Distributed routing?"}
    Q6 -->|Yes| CH["Consistent Hashing"]
    style Q1 fill:#f59e0b,color:#fff`
      );
    }
  }
}

async function main() {
  console.log('Parsing system design content...');
  fs.mkdirSync(OUT, { recursive: true });

  const topics: SysDesignTopic[] = [];
  for (const { file, id, slug } of TOPIC_FILES) {
    const filePath = path.join(SYS_DESIGN_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${file} - not found`);
      continue;
    }
    const topic = await parseTopic(file, id, slug);
    topics.push(topic);
    console.log(`  ${topic.title}: ${topic.sections.length} sections`);
  }

  addSupplementaryDiagrams(topics);

  fs.writeFileSync(
    path.join(OUT, 'sysdesign-topics.json'),
    JSON.stringify(topics, null, 2)
  );

  console.log(`System design parsing complete! ${topics.length} topics.`);
}

main().catch(err => { console.error(err); process.exit(1); });
