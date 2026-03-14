import type { InterviewSession } from '../types';

export const interviews: InterviewSession[] = [
  {
    id: 'interview-1',
    slug: 'docker-service-registry',
    title: 'Event-Based Docker Service Registry',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    briefing: 'Design a system that tracks Docker services across a cluster. Two data streams arrive: (a) Docker events with service metadata (container ID, image, ports, labels), and (b) library/dependency data mapped to Docker IDs. A client page must show which libraries are running in each container, updated in near real-time.',
    steps: [
      {
        id: 'step-1',
        title: 'Requirements Clarification',
        prompt: 'What questions would you ask to clarify the requirements? Consider scale, latency expectations, and query patterns.',
        guidanceHtml: '<ul><li><strong>Scale</strong>: How many containers? Hundreds vs thousands vs tens of thousands.</li><li><strong>Latency</strong>: Is real-time push required or is near-real-time (seconds) acceptable?</li><li><strong>Query patterns</strong>: Do users query by container, by library, or both? Is historical data needed?</li><li><strong>Data volume</strong>: How frequently do Docker events and library scans occur?</li></ul>',
        tips: ['Always start by scoping the problem', 'Ask about read vs write ratios', 'Clarify if historical tracking is needed'],
      },
      {
        id: 'step-2',
        title: 'Data Ingestion',
        prompt: 'How would you ingest both data streams? What technology would you choose and why?',
        guidanceHtml: '<p>Use <strong>Apache Kafka</strong> with two topics:</p><ul><li><code>docker-events</code>: Partitioned by container ID for ordering guarantees per container.</li><li><code>library-scans</code>: Partitioned by Docker ID to co-locate with events.</li></ul><p>Key-based partitioning ensures all data for a given container lands in the same partition, enabling efficient stream joins.</p>',
        mermaidDiagram: `graph LR
    DE[Docker Events] --> K1[Kafka: docker-events]
    LS[Library Scans] --> K2[Kafka: library-scans]
    K1 & K2 --> SP[Stream Processor]
    style K1 fill:#3b82f6,color:#fff
    style K2 fill:#8b5cf6,color:#fff
    style SP fill:#22c55e,color:#fff`,
        tips: ['Kafka key-based partitioning guarantees per-key ordering', 'Two topics allow independent scaling of ingestion'],
      },
      {
        id: 'step-3',
        title: 'Data Model & Stream Processing',
        prompt: 'How would you join the two streams and what would the materialized view look like?',
        guidanceHtml: '<p>Use <strong>Kafka Streams</strong> or <strong>Apache Flink</strong> to perform a stream-stream join on Docker ID:</p><ul><li>Join Docker event metadata with library scan results</li><li>Materialize a <strong>Redis Hash</strong> per container ID: <code>container:{id} → {image, ports, labels, libraries[]}</code></li><li>Each update from the stream processor overwrites the Redis entry</li></ul>',
        mermaidDiagram: `graph TD
    K1[docker-events] & K2[library-scans] --> JOIN[Stream Join on Docker ID]
    JOIN --> MV[Materialized View]
    MV --> Redis[(Redis Hash per Container)]
    style JOIN fill:#f59e0b,color:#fff
    style Redis fill:#ef4444,color:#fff`,
        tips: ['Stream joins require a time window — define acceptable staleness', 'Redis Hashes provide O(1) field-level reads'],
      },
      {
        id: 'step-4',
        title: 'Storage Layer',
        prompt: 'What storage would you use for real-time queries vs historical audit?',
        guidanceHtml: '<ul><li><strong>Redis</strong>: Primary store for real-time queries. Hash per Docker ID gives fast lookups. TTL on entries auto-cleans removed containers.</li><li><strong>PostgreSQL</strong>: Historical audit log. Append-only table of events with timestamps for compliance and debugging.</li></ul>',
        tips: ['Dual-write pattern: fast cache for reads, durable store for audit', 'Consider TTL on Redis keys for containers that stop'],
      },
      {
        id: 'step-5',
        title: 'API & Client',
        prompt: 'How would the client page get real-time updates?',
        guidanceHtml: '<ul><li><strong>WebSocket / SSE</strong>: Push updates to the client when Redis entries change. Subscribe to a Redis Pub/Sub channel or Kafka topic for change events.</li><li><strong>REST fallback</strong>: <code>GET /containers</code> with pagination, <code>GET /containers/{id}</code> for detail.</li><li>Client renders a table of containers with their libraries, auto-updating via WebSocket.</li></ul>',
        tips: ['SSE is simpler than WebSocket if you only need server-to-client push', 'Include a REST endpoint as fallback for initial page load'],
      },
      {
        id: 'step-6',
        title: 'Failure Handling',
        prompt: 'What happens if a consumer crashes or Kafka becomes temporarily unavailable?',
        guidanceHtml: '<ul><li><strong>Consumer group rebalancing</strong>: Kafka automatically reassigns partitions to remaining consumers.</li><li><strong>Offset tracking</strong>: Commit offsets after processing, not before. Use at-least-once delivery with idempotent writes to Redis (SET is naturally idempotent).</li><li><strong>Circuit breaker</strong>: If Redis is down, buffer in Kafka (it retains messages) and replay when Redis recovers.</li></ul>',
        tips: ['Idempotent operations simplify exactly-once semantics', 'Kafka retention acts as a natural buffer during outages'],
      },
    ],
    finalDiagram: `graph TD
    DE[Docker Daemon] -->|events| K1[Kafka: docker-events]
    LS[Library Scanner] -->|scans| K2[Kafka: library-scans]
    K1 & K2 --> SP[Kafka Streams / Flink]
    SP --> Redis[(Redis)]
    SP --> PG[(PostgreSQL Audit)]
    Redis --> API[REST API]
    Redis -->|pub/sub| WS[WebSocket Server]
    API --> Client[Web Client]
    WS --> Client
    style K1 fill:#3b82f6,color:#fff
    style K2 fill:#8b5cf6,color:#fff
    style SP fill:#22c55e,color:#fff
    style Redis fill:#ef4444,color:#fff
    style PG fill:#f59e0b,color:#fff`,
  },
  {
    id: 'interview-2',
    slug: 'gis-missile-alert',
    title: 'GIS Missile Alert System',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    briefing: 'Design a polygon-based missile alert system with three stages: Stage 1 (first indication from raw sensors), Stage 2 (confirmed trajectory with refined polygon), and Stage 3 (user alert push to civilians). A dashboard must show stage-transition ratios, true-positive rates based on polygon overlap across all three stages, and false-negative analysis.',
    steps: [
      {
        id: 'step-1',
        title: 'Requirements',
        prompt: 'What are the critical requirements for a missile alert system? Think about latency, reliability, and precision.',
        guidanceHtml: '<ul><li><strong>Latency SLA</strong>: Sub-second stage transitions. Stage 1→2 within 2 seconds, Stage 2→3 push within 5 seconds.</li><li><strong>Polygon precision</strong>: GeoJSON polygons with at least 100m resolution. Stage 2 refines Stage 1\'s polygon.</li><li><strong>Push notification SLA</strong>: Alert all civilians in the danger zone within 10 seconds of Stage 3.</li><li><strong>Availability</strong>: 99.999% — this is a life-safety system.</li></ul>',
        tips: ['Life-safety systems require extreme availability guarantees', 'Latency requirements will drive technology choices'],
      },
      {
        id: 'step-2',
        title: 'Data Model',
        prompt: 'How would you model the alert data and spatial information?',
        guidanceHtml: '<p>Use <strong>PostGIS</strong> (PostgreSQL + spatial extension):</p><ul><li><strong>Alert entity</strong>: <code>{id, stage (1|2|3), polygon (GeoJSON), timestamp, confidence, sensor_source}</code></li><li><strong>Polygon progression</strong>: Each stage has its own polygon. Stage 2 is typically a subset of Stage 1.</li><li>Spatial index (GiST) on polygon column for fast intersection queries.</li></ul>',
        tips: ['PostGIS handles spatial operations natively', 'Store polygon history for each stage for audit'],
      },
      {
        id: 'step-3',
        title: 'Event Pipeline',
        prompt: 'Design the event-driven pipeline from sensor input to user alert.',
        guidanceHtml: '<p>Three-stage event pipeline via <strong>Kafka</strong>:</p><ul><li><strong>Stage 1</strong>: Raw sensor data → detection service → writes alert with polygon → publishes to Kafka</li><li><strong>Stage 2</strong>: Enrichment service consumes Stage 1 events → confirms trajectory → refines polygon → publishes Stage 2 event</li><li><strong>Stage 3</strong>: Alert service consumes Stage 2 → triggers push notification fan-out → publishes Stage 3 event</li><li>Each stage writes to PostGIS for audit and statistics.</li></ul>',
        mermaidDiagram: `graph LR
    S[Sensors] --> D1[Stage 1: Detection]
    D1 --> K[Kafka]
    K --> D2[Stage 2: Confirmation]
    D2 --> K
    K --> D3[Stage 3: Alert]
    D3 --> Push[Push Service]
    D1 & D2 & D3 --> DB[(PostGIS)]
    style D1 fill:#ef4444,color:#fff
    style D2 fill:#f59e0b,color:#fff
    style D3 fill:#22c55e,color:#fff`,
        tips: ['Each stage is an independent service for fault isolation', 'Kafka provides replay capability for re-analysis'],
      },
      {
        id: 'step-4',
        title: 'Spatial Analysis',
        prompt: 'How would you compute polygon overlap and true-positive rates?',
        guidanceHtml: '<p>Use PostGIS spatial functions:</p><ul><li><code>ST_Intersection(poly1, poly2)</code>: Computes the overlapping region.</li><li><code>ST_Area(intersection) / ST_Area(poly1)</code>: Overlap ratio.</li><li><strong>True positive</strong>: Alert appears in all 3 stages AND polygon overlap ratio > threshold (e.g., 70%).</li><li><strong>Pre-compute</strong>: Materialized view of overlap matrices updated on each stage transition.</li></ul>',
        mermaidDiagram: `graph TD
    S1P[Stage 1 Polygon] --> INT[ST_Intersection]
    S2P[Stage 2 Polygon] --> INT
    INT --> OV[Overlap Area]
    OV --> TP{"overlap > 70%?"}
    TP -->|Yes| TRUE[True Positive]
    TP -->|No| FALSE[False Positive]
    style INT fill:#3b82f6,color:#fff`,
        tips: ['PostGIS spatial indexes make intersection queries fast', 'Materialized views avoid re-computing for dashboard queries'],
      },
      {
        id: 'step-5',
        title: 'Statistics Engine',
        prompt: 'How would you compute and display stage ratios and accuracy metrics on the dashboard?',
        guidanceHtml: '<ul><li><strong>Stage ratios</strong>: <code>count(Stage N+1) / count(Stage N)</code> as materialized views refreshed every minute.</li><li><strong>TP rate</strong>: Alerts reaching all 3 stages with polygon overlap > threshold / total Stage 1 alerts.</li><li><strong>FN rate</strong>: Confirmed events (Stage 2+) that never reached Stage 3 / total Stage 2 alerts.</li><li>Store in a time-series format for trend analysis on the dashboard.</li></ul>',
        tips: ['Pre-aggregate statistics rather than computing on every dashboard load', 'Time-series view of accuracy metrics shows system improvement over time'],
      },
      {
        id: 'step-6',
        title: 'Push Notification Fan-out',
        prompt: 'How would you push alerts to millions of civilians in a danger zone within seconds?',
        guidanceHtml: '<ul><li><strong>Geo-indexed user registry</strong>: Store user locations in a spatial index. Query <code>ST_Contains(danger_polygon, user_location)</code> to find affected users.</li><li><strong>Fan-out</strong>: Send to FCM (Android) / APNS (iOS) via a worker pool. Partition users by region for parallel processing.</li><li><strong>Rate limiting</strong>: Debounce repeated alerts for the same event to prevent alert fatigue.</li><li><strong>Fallback</strong>: SMS gateway for users without push notification capability.</li></ul>',
        tips: ['Geo-spatial user queries must be sub-second', 'Consider tiered alerting: push → SMS → sirens'],
      },
    ],
    finalDiagram: `graph TD
    Sensors[Radar/Sensors] --> S1[Stage 1: Detection]
    S1 --> Kafka[Kafka]
    Kafka --> S2[Stage 2: Confirmation]
    S2 --> Kafka
    Kafka --> S3[Stage 3: Alert]
    S1 & S2 & S3 --> PostGIS[(PostGIS)]
    PostGIS --> Stats[Statistics Engine]
    Stats --> Dashboard[Dashboard]
    S3 --> Push[Push Service]
    Push --> FCM[FCM/APNS]
    Push --> SMS[SMS Gateway]
    FCM & SMS --> Users[Civilians]
    style S1 fill:#ef4444,color:#fff
    style S2 fill:#f59e0b,color:#fff
    style S3 fill:#22c55e,color:#fff
    style PostGIS fill:#3b82f6,color:#fff`,
  },
  {
    id: 'interview-3',
    slug: 'ai-prompt-to-site',
    title: 'AI Prompt-to-Site Generator',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    briefing: 'Design a system that converts user text prompts into websites. Handle rate limiting, prompt injection security, and a template system. Phase 2: suggest new templates based on user activity patterns.',
    steps: [
      {
        id: 'step-1',
        title: 'Requirements',
        prompt: 'What are the key requirements and constraints for a prompt-to-site generator?',
        guidanceHtml: '<ul><li><strong>Generation latency</strong>: Target < 30 seconds for a basic site.</li><li><strong>Concurrent users</strong>: Support 10K concurrent generation requests.</li><li><strong>Template library</strong>: Start with 50-100 templates, growing via Phase 2.</li><li><strong>Security</strong>: Must prevent prompt injection, XSS in generated HTML, and resource abuse.</li></ul>',
        tips: ['LLM calls are expensive — discuss cost optimization early', 'Security is critical when generating executable HTML'],
      },
      {
        id: 'step-2',
        title: 'Rate Limiting',
        prompt: 'How would you implement rate limiting for this system?',
        guidanceHtml: '<ul><li><strong>Algorithm</strong>: Token bucket or sliding window counter in <strong>Redis</strong>.</li><li><strong>Layers</strong>: Per-user (authenticated) + per-IP (anonymous) rate limits.</li><li><strong>Tiers</strong>: Free tier (5 generations/day), paid tier (100/day), enterprise (unlimited with queue priority).</li><li>Return <code>429 Too Many Requests</code> with <code>Retry-After</code> header.</li></ul>',
        tips: ['Redis INCR + EXPIRE is the simplest sliding window implementation', 'Consider separate limits for generation vs preview requests'],
      },
      {
        id: 'step-3',
        title: 'Prompt Security',
        prompt: 'How would you protect against prompt injection and malicious output?',
        guidanceHtml: '<ul><li><strong>Input sanitization</strong>: Strip control characters, limit prompt length (e.g., 2000 chars).</li><li><strong>System prompt isolation</strong>: Use separate system/user message roles. Never interpolate user input into system prompts.</li><li><strong>Output validation</strong>: Parse generated HTML, strip &lt;script&gt; tags, validate against an allowlist of HTML elements.</li><li><strong>CSP headers</strong>: Serve generated sites with strict Content-Security-Policy.</li><li><strong>LLM guardrails</strong>: Use a classifier to detect attempts to override system instructions.</li></ul>',
        tips: ['Defense in depth: validate both input AND output', 'CSP is your last line of defense against XSS in generated content'],
      },
      {
        id: 'step-4',
        title: 'Generation Pipeline',
        prompt: 'Walk through the end-to-end generation flow from user prompt to deployed site.',
        guidanceHtml: '<p>The pipeline processes requests through multiple stages:</p><ol><li>Request → <strong>Rate Limiter</strong> (Redis check)</li><li>→ <strong>Template Matcher</strong> (check semantic similarity against template library)</li><li>→ Cache hit? Use template : Send to <strong>LLM</strong> for generation</li><li>→ <strong>Output Sanitizer</strong> (validate HTML, strip dangerous elements)</li><li>→ <strong>CDN Deploy</strong> (upload to S3/CloudFront, assign subdomain)</li><li>→ Return URL to user</li></ol>',
        mermaidDiagram: `graph LR
    User[User Prompt] --> RL[Rate Limiter]
    RL --> TM[Template Matcher]
    TM -->|cache hit| Cache[(Template Cache)]
    TM -->|miss| LLM[LLM API]
    Cache & LLM --> San[Output Sanitizer]
    San --> CDN[CDN Deploy]
    CDN --> URL[Site URL]
    style RL fill:#ef4444,color:#fff
    style TM fill:#f59e0b,color:#fff
    style LLM fill:#8b5cf6,color:#fff
    style CDN fill:#22c55e,color:#fff`,
        tips: ['Template matching before LLM call saves cost and latency', 'Async generation with a job queue handles burst traffic'],
      },
      {
        id: 'step-5',
        title: 'Template System',
        prompt: 'How would the template matching work? What similarity approach would you use?',
        guidanceHtml: '<ul><li><strong>Embedding vectors</strong>: Convert prompts and templates to vectors using an embedding model.</li><li><strong>Vector DB</strong>: Store template embeddings in Pinecone/pgvector. Query with cosine similarity.</li><li><strong>Threshold</strong>: If similarity > 0.85, adapt the template instead of calling the LLM. This is faster and cheaper.</li><li><strong>Exact match cache</strong>: Redis cache for identical prompts (hash the normalized prompt as key).</li></ul>',
        tips: ['Embeddings enable fuzzy matching — "portfolio website" matches "personal portfolio page"', 'Two-tier cache: exact match (Redis) → semantic match (vector DB) → LLM'],
      },
      {
        id: 'step-6',
        title: 'Phase 2: Template Suggestions',
        prompt: 'How would you automatically suggest new templates based on user activity?',
        guidanceHtml: '<ul><li><strong>Batch job</strong>: Nightly clustering of recent prompts using k-means on embedding vectors.</li><li><strong>Gap analysis</strong>: Identify popular clusters that don\'t have a matching template (cluster center far from nearest template).</li><li><strong>Candidate generation</strong>: Auto-generate template candidates from cluster centroids using the LLM.</li><li><strong>Human review pipeline</strong>: Queue candidates for designer review before adding to the template library.</li></ul>',
        tips: ['Clustering reveals what users actually want, not what you guessed', 'Always include human review before auto-adding templates'],
      },
    ],
    finalDiagram: `graph TD
    User[User] --> RL[Rate Limiter - Redis]
    RL --> Sec[Input Sanitizer]
    Sec --> TM[Template Matcher]
    TM --> VDB[(Vector DB)]
    TM --> Cache[(Redis Cache)]
    TM -->|miss| LLM[LLM API]
    Cache & LLM --> Val[Output Validator]
    Val --> S3[S3 + CloudFront]
    S3 --> URL[Generated Site]
    User --> Analytics[Usage Analytics]
    Analytics --> Batch[Nightly Clustering]
    Batch --> Review[Human Review Queue]
    Review --> VDB
    style RL fill:#ef4444,color:#fff
    style LLM fill:#8b5cf6,color:#fff
    style S3 fill:#22c55e,color:#fff
    style VDB fill:#3b82f6,color:#fff`,
  },
  {
    id: 'interview-4',
    slug: 'network-latency-alert',
    title: 'Network Latency Alert System',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    briefing: 'Design a system that receives latency measurements between services (N:N graph). Detect latency degradation on any edge, log detections, and push alerts to a monitoring dashboard client.',
    steps: [
      {
        id: 'step-1',
        title: 'Requirements',
        prompt: 'What requirements would you clarify for a network latency monitoring system?',
        guidanceHtml: '<ul><li><strong>Number of services</strong>: Hundreds to thousands of microservices.</li><li><strong>Measurement frequency</strong>: Every 10-30 seconds per service pair.</li><li><strong>Alert SLA</strong>: Detect degradation within 60 seconds, alert within 90 seconds.</li><li><strong>Graph density</strong>: Not all services communicate — sparse graph (each service talks to 5-20 others).</li></ul>',
        tips: ['With N services, the graph has up to N*(N-1) edges — clarify sparsity early', 'Measurement frequency drives data volume calculations'],
      },
      {
        id: 'step-2',
        title: 'Data Ingestion',
        prompt: 'How would you collect and ingest latency measurements from services?',
        guidanceHtml: '<ul><li><strong>Lightweight agents</strong>: Each service runs a sidecar/agent that reports latency per outbound call.</li><li><strong>Message format</strong>: <code>{source, target, latency_ms, timestamp}</code></li><li><strong>Kafka buffer</strong>: Agents publish to a Kafka topic partitioned by source service for ordering.</li><li><strong>Time-series DB</strong>: Consumers write measurements to InfluxDB or TimescaleDB for historical queries and dashboards.</li></ul>',
        mermaidDiagram: `graph LR
    A1[Service A Agent] --> K[Kafka: latency-metrics]
    A2[Service B Agent] --> K
    A3[Service C Agent] --> K
    K --> TSDB[(TimescaleDB / InfluxDB)]
    K --> AD[Anomaly Detector]
    style K fill:#3b82f6,color:#fff
    style TSDB fill:#22c55e,color:#fff
    style AD fill:#ef4444,color:#fff`,
        tips: ['Kafka decouples collection from processing', 'Time-series DBs are optimized for this exact workload'],
      },
      {
        id: 'step-3',
        title: 'Graph Model',
        prompt: 'How would you model the service topology and baseline latencies?',
        guidanceHtml: '<ul><li><strong>Adjacency list</strong>: In-memory map of <code>service → [connected services]</code>.</li><li><strong>Edge weights</strong>: Current latency + historical baseline per edge.</li><li><strong>Baseline computation</strong>: Rolling average over the last 24 hours, updated hourly.</li><li>Store baselines in the TSDB; load into the anomaly detector\'s memory on startup.</li></ul>',
        tips: ['In-memory graph model enables fast threshold checks', 'Baselines should account for time-of-day patterns'],
      },
      {
        id: 'step-4',
        title: 'Anomaly Detection',
        prompt: 'How would you detect latency degradation on a specific edge?',
        guidanceHtml: '<ul><li><strong>Algorithm</strong>: Per-edge rolling average + standard deviation. Alert when measurement > baseline + k*sigma (e.g., k=3).</li><li><strong>Alternative</strong>: EWMA (Exponentially Weighted Moving Average) for faster response to recent changes.</li><li><strong>Implementation</strong>: Flink or a Kafka Streams app that maintains per-edge state.</li><li><strong>Debounce</strong>: Require N consecutive anomalous measurements (e.g., 3) before alerting to avoid false positives from transient spikes.</li></ul>',
        mermaidDiagram: `graph TD
    M[Measurement] --> Check{"latency > baseline + 3σ?"}
    Check -->|No| OK[Normal]
    Check -->|Yes| Count{"3 consecutive?"}
    Count -->|No| Watch[Watching]
    Count -->|Yes| Alert[Fire Alert!]
    Alert --> Log[(PostgreSQL Log)]
    Alert --> WS[WebSocket Push]
    style Alert fill:#ef4444,color:#fff
    style OK fill:#22c55e,color:#fff`,
        tips: ['Z-score detection is simple and effective for normally distributed latencies', 'Debouncing prevents alert storms from transient spikes'],
      },
      {
        id: 'step-5',
        title: 'Alert Pipeline',
        prompt: 'How would you log alerts and push them to monitoring clients?',
        guidanceHtml: '<ul><li><strong>Alert log</strong>: Write to PostgreSQL with: <code>{source, target, detected_latency, baseline, sigma, timestamp, resolved_at}</code></li><li><strong>Push to clients</strong>: WebSocket or SSE connection from dashboard to alert service.</li><li><strong>Alert lifecycle</strong>: OPEN → ACKNOWLEDGED → RESOLVED (auto-resolve when latency returns to normal for 5 minutes).</li></ul>',
        tips: ['Separate alert storage from metrics storage — different query patterns', 'Auto-resolution prevents stale alerts on the dashboard'],
      },
      {
        id: 'step-6',
        title: 'Dashboard',
        prompt: 'What would the monitoring dashboard show?',
        guidanceHtml: '<ul><li><strong>Service topology graph</strong>: Interactive graph with edges color-coded: green (normal), yellow (elevated), red (alerting).</li><li><strong>Historical latency charts</strong>: Time-series line charts per edge, showing baseline band + actual measurements.</li><li><strong>Alert feed</strong>: Real-time list of active and recent alerts with drill-down.</li><li><strong>Heatmap</strong>: Services × services matrix with latency colors for quick overview.</li></ul>',
        tips: ['The topology graph is the highest-value visualization', 'Color-coded edges give instant system health overview'],
      },
    ],
    finalDiagram: `graph TD
    Services[Microservices] -->|agents| Kafka[Kafka: latency-metrics]
    Kafka --> TSDB[(TimescaleDB)]
    Kafka --> AD[Anomaly Detector - Flink]
    AD --> PG[(PostgreSQL Alerts)]
    AD --> WS[WebSocket Server]
    TSDB --> Dashboard[Dashboard]
    PG --> Dashboard
    WS --> Dashboard
    style Kafka fill:#3b82f6,color:#fff
    style TSDB fill:#22c55e,color:#fff
    style AD fill:#ef4444,color:#fff
    style PG fill:#f59e0b,color:#fff`,
  },
];
