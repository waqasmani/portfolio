import type { Prisma } from '../../src/generated/prisma/client';

type ProjectSeed = Omit<Prisma.ProjectCreateInput, 'publishedAt'> & {
  publishedAt?: Date;
};

export const projects: ProjectSeed[] = [
  {
    slug: 'northwind-ops',
    title: 'Northwind Ops',
    tagline: 'Multi-tenant operations platform for wholesale distributors',
    description:
      'A multi-tenant SaaS that gives wholesale distributors a single control room for inventory, purchasing, and fulfilment. Northwind Ops replaced a patchwork of spreadsheets and legacy desktop software with a real-time web platform used daily by warehouse teams across three countries.',
    category: 'SAAS',
    clientType: 'B2B SaaS product',
    year: 2025,
    featured: true,
    sortOrder: 1,
    status: 'PUBLISHED',
    accent: 'indigo',
    problem:
      'The client ran seven warehouses on a 15-year-old desktop ERP. Stock counts were synced nightly by email, purchasing decisions were made against stale data, and onboarding a new warehouse took weeks of manual setup. They needed a web platform that multiple companies in their group could share — without seeing each other’s data.',
    solution:
      'I designed and built a row-level multi-tenant architecture on PostgreSQL with a Next.js front end and a Fastify service layer. Every query is scoped by tenant at the database level, stock movements stream to open dashboards over Server-Sent Events, and a rules engine flags low stock and dead inventory automatically. New tenants are provisioned in minutes through an admin console.',
    challenges: [
      {
        title: 'Tenant isolation without a database per customer',
        challenge:
          'Separate databases per tenant would have made cross-group reporting and migrations painful, but naive shared tables risked catastrophic data leaks between companies.',
        solution:
          'Adopted PostgreSQL row-level security with tenant IDs enforced by policies, wrapped in a Prisma client extension that injects tenant context on every query. A test suite runs every endpoint against two seeded tenants and asserts zero cross-tenant reads.',
      },
      {
        title: 'Live stock levels across seven warehouses',
        challenge:
          'Warehouse teams needed to see stock changes made by colleagues within seconds, but the client’s budget ruled out heavyweight streaming infrastructure.',
        solution:
          'Stock mutations publish to Redis, and a thin SSE gateway fans changes out to subscribed dashboards. The approach handles hundreds of concurrent viewers on a single node with graceful reconnection and event replay.',
      },
      {
        title: 'Migrating 1.2M records from a legacy ERP',
        challenge:
          'Fifteen years of inconsistent product codes, duplicated suppliers, and orphaned purchase orders had to be imported without halting daily operations.',
        solution:
          'Built an idempotent ETL pipeline with staged validation reports the client could review before each cutover. The final migration ran over a weekend with a reconciliation report showing 100% of stock value accounted for.',
      },
    ],
    architecture: {
      frontend: ['Next.js (App Router)', 'React', 'TypeScript', 'Tailwind CSS'],
      backend: ['Fastify', 'Node.js', 'BullMQ job queues', 'SSE gateway'],
      database: ['PostgreSQL (row-level security)', 'Prisma', 'Redis'],
      infrastructure: ['Docker Compose', 'Nginx', 'Ubuntu VPS cluster', 'GitHub Actions CI/CD'],
      services: ['Cloudflare (DNS + WAF)', 'Cloudflare R2 (documents)', 'Resend (email)'],
    },
    results: [
      { value: '7', metric: 'warehouses live', description: 'All sites migrated within one quarter, zero downtime cutovers.' },
      { value: '92%', metric: 'less stock drift', description: 'Discrepancies between recorded and counted stock collapsed after real-time sync.' },
      { value: '3 min', metric: 'tenant provisioning', description: 'Down from a multi-week manual onboarding process.' },
      { value: '±2s', metric: 'dashboard latency', description: 'Stock movements visible across all connected clients in seconds.' },
    ],
    gallery: [
      { title: 'Inventory control room', description: 'Live stock dashboard with low-stock alerts and movement feed.' },
      { title: 'Purchasing workbench', description: 'Suggested purchase orders generated from velocity and lead times.' },
      { title: 'Tenant admin console', description: 'Provisioning, roles, and per-tenant configuration.' },
    ],
    stack: ['Next.js', 'TypeScript', 'Fastify', 'PostgreSQL', 'Prisma', 'Redis', 'Docker', 'Nginx', 'Cloudflare R2'],
    liveUrl: null,
    githubUrl: null,
    views: 1284,
  },
  {
    slug: 'vela-commerce',
    title: 'Vela Commerce',
    tagline: 'Headless e-commerce storefront with a custom checkout',
    description:
      'A performance-obsessed storefront for a furniture brand selling made-to-order pieces. Vela pairs a statically generated catalogue with a fully custom checkout, configurator, and order-tracking portal — replacing a slow themed storefront that was losing mobile customers.',
    category: 'ECOMMERCE',
    clientType: 'Client project — retail brand',
    year: 2025,
    featured: false,
    sortOrder: 2,
    status: 'PUBLISHED',
    accent: 'amber',
    problem:
      'The brand’s previous store took over six seconds to render a product page on 4G, and its rigid theme couldn’t express made-to-order options like fabric, finish, and dimensions. Cart abandonment on mobile was above 80%, and the team managed orders through email threads.',
    solution:
      'I rebuilt the storefront as a statically generated Next.js app with an edge-cached product catalogue and an interactive product configurator. A custom Stripe checkout supports deposits for made-to-order pieces, and customers follow production stages in a live order portal. Content editors manage the catalogue through a structured CMS with instant preview.',
    challenges: [
      {
        title: 'A configurator that stays fast',
        challenge:
          'Every product had thousands of valid combinations of fabric, finish, and size — too many to pre-render, too interactive to fetch on every click.',
        solution:
          'Encoded option rules as a compact constraint graph shipped with the page (~4KB per product). The client resolves valid combinations and pricing locally, so configuration feels instant even offline.',
      },
      {
        title: 'Deposits and split payments',
        challenge:
          'Made-to-order pieces required a 30% deposit at order time and the balance before delivery — a flow Stripe Checkout doesn’t support out of the box.',
        solution:
          'Modelled orders as payment schedules with Stripe PaymentIntents, webhook-driven state transitions, and automated balance reminders. Every money movement is recorded in an append-only ledger table for clean reconciliation.',
      },
      {
        title: 'Core Web Vitals on image-heavy pages',
        challenge:
          'Interior photography sells furniture, but 4K imagery was destroying LCP on mobile.',
        solution:
          'AVIF/WebP pipelines with responsive srcsets served from Cloudflare R2 behind an image resizing worker, plus priority hints for the hero image. Product pages now hit an LCP of 1.4s on throttled 4G.',
      },
    ],
    architecture: {
      frontend: ['Next.js (SSG + ISR)', 'React', 'TypeScript', 'Tailwind CSS'],
      backend: ['Next.js Route Handlers', 'Stripe webhooks', 'Order state machine'],
      database: ['PostgreSQL', 'Prisma'],
      infrastructure: ['Vercel-compatible build, self-hosted on Docker + Nginx', 'GitHub Actions'],
      services: ['Stripe (payments)', 'Cloudflare R2 + image resizing', 'Resend (transactional email)'],
    },
    results: [
      { value: '1.4s', metric: 'LCP on mobile', description: 'Down from 6.2s on the themed platform.' },
      { value: '+34%', metric: 'checkout conversion', description: 'Measured over 90 days after relaunch.' },
      { value: '100', metric: 'Lighthouse SEO', description: 'Structured data for every product and category.' },
    ],
    gallery: [
      { title: 'Product configurator', description: 'Fabric, finish, and dimension options with live pricing.' },
      { title: 'Custom checkout', description: 'Deposit-aware checkout with Stripe.' },
      { title: 'Order tracking portal', description: 'Customers follow production stages in real time.' },
    ],
    stack: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL', 'Prisma', 'Cloudflare R2', 'Tailwind CSS'],
    liveUrl: null,
    githubUrl: null,
    views: 967,
  },
  {
    slug: 'atlas-crm',
    title: 'Atlas CRM',
    tagline: 'Custom CRM and quoting engine for a freight forwarder',
    description:
      'A purpose-built CRM for a freight forwarding company whose sales process never fit generic tools. Atlas combines pipeline management with an instant quoting engine that prices multi-leg shipments — turning a two-day quoting turnaround into a two-minute one.',
    category: 'CRM',
    clientType: 'Client project — logistics',
    year: 2024,
    featured: false,
    sortOrder: 3,
    status: 'PUBLISHED',
    accent: 'emerald',
    problem:
      'Sales reps juggled a generic CRM, a rate spreadsheet with 40 tabs, and email to produce quotes. Quotes took one to two days, rates were often outdated, and management had no reliable pipeline forecast. Off-the-shelf CRMs couldn’t model multi-leg freight pricing at all.',
    solution:
      'I built a CRM around their actual objects — shipments, lanes, carriers, and rate cards — with a quoting engine that assembles multi-leg routes and applies margin rules automatically. Reps generate branded PDF quotes in minutes, and a live dashboard forecasts pipeline by lane and month. Rate cards import from carrier spreadsheets with validation.',
    challenges: [
      {
        title: 'Modelling multi-leg freight pricing',
        challenge:
          'A single quote could span ocean, port handling, customs, and trucking legs, each with different units (per-container, per-kg, flat) and currency.',
        solution:
          'Designed a normalized rate schema with leg types, break tables, and currency-aware money handling (integer minor units everywhere). The pricing engine is a pure, exhaustively unit-tested function — 240 test cases generated from historical quotes.',
      },
      {
        title: 'Trustworthy spreadsheet imports',
        challenge:
          'Carriers send rate updates as inconsistent Excel files; a silent mis-import could underprice a route by thousands.',
        solution:
          'Built a column-mapping import wizard with a validation stage that diffs new rates against current ones and flags moves beyond a threshold for human review before activation.',
      },
      {
        title: 'Adoption by a non-technical sales team',
        challenge: 'The previous CRM failed because reps found it slower than their spreadsheets.',
        solution:
          'Obsessive keyboard-first UX: global command palette, inline editing, optimistic updates, and sub-100ms interactions. Weekly shadowing sessions during rollout shaped the defaults. Adoption hit 100% within a month.',
      },
    ],
    architecture: {
      frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'TanStack Table'],
      backend: ['Node.js', 'Express', 'PDF generation service', 'Import pipeline'],
      database: ['MariaDB', 'Prisma', 'Redis (caching + sessions)'],
      infrastructure: ['Docker', 'Nginx', 'PM2', 'Ubuntu server on-premises'],
      services: ['Exchange-rate API', 'Company e-mail via SMTP relay'],
    },
    results: [
      { value: '2 min', metric: 'quote turnaround', description: 'Down from 1–2 business days.' },
      { value: '+22%', metric: 'quote win rate', description: 'Faster responses won time-sensitive lanes.' },
      { value: '100%', metric: 'rep adoption', description: 'Spreadsheets retired within a month of rollout.' },
    ],
    gallery: [
      { title: 'Pipeline board', description: 'Deals by stage with lane and margin breakdowns.' },
      { title: 'Quote builder', description: 'Multi-leg route assembly with live margin preview.' },
      { title: 'Rate card manager', description: 'Versioned carrier rates with diff-based imports.' },
    ],
    stack: ['Next.js', 'TypeScript', 'Express', 'MariaDB', 'Prisma', 'Redis', 'Docker', 'PM2'],
    liveUrl: null,
    githubUrl: null,
    views: 733,
  },
  {
    slug: 'pulse-api',
    title: 'Pulse API',
    tagline: 'High-throughput event ingestion and analytics API',
    description:
      'The backbone of a product analytics tool: a write-optimized ingestion API that accepts tens of millions of events per day from web and mobile SDKs, with a query layer that keeps dashboards interactive. Built for a startup that outgrew its serverless MVP.',
    category: 'API',
    clientType: 'Client project — analytics startup',
    year: 2024,
    featured: false,
    sortOrder: 4,
    status: 'PUBLISHED',
    accent: 'sky',
    problem:
      'The startup’s serverless ingestion endpoint fell over at traffic spikes, cost scaled linearly with volume, and cold starts caused SDK retries that doubled the load. Dashboard queries timed out beyond thirty days of data. They needed predictable cost and sub-second queries without hiring a data team.',
    solution:
      'I replaced the MVP with a Fastify ingestion service that validates, batches, and writes events through a back-pressured queue into partitioned PostgreSQL tables, with continuous roll-ups powering the dashboard. The system rides out 50× spikes on two modest VPS nodes, and a token-bucket rate limiter with per-key quotas keeps abusive clients contained.',
    challenges: [
      {
        title: 'Absorbing 50× traffic spikes',
        challenge:
          'Marketing pushes caused minute-long bursts far above baseline; dropping events was unacceptable, but provisioning for peak was unaffordable.',
        solution:
          'Requests are acknowledged after landing in an in-process ring buffer flushed by batch writers with adaptive batch sizing. Back-pressure sheds load gracefully by degrading enrichment before ever dropping events.',
      },
      {
        title: 'Fast queries over billions of rows',
        challenge: 'Raw event scans couldn’t support interactive dashboards beyond a month of history.',
        solution:
          'Time-partitioned tables with BRIN indexes plus incrementally refreshed roll-up tables per metric granularity. The query planner picks roll-ups automatically; 95th percentile dashboard query time is 320ms over a year of data.',
      },
      {
        title: 'Safe multi-tenant rate limiting',
        challenge: 'One misconfigured SDK integration could starve every other customer.',
        solution:
          'Per-API-key token buckets in Redis with burst allowances and standard RateLimit headers, plus an abuse dashboard showing per-key consumption and automatic notification when keys approach quota.',
      },
    ],
    architecture: {
      frontend: ['Admin dashboard in Next.js', 'Recharts-style custom SVG charts'],
      backend: ['Fastify', 'Node.js cluster', 'Batch ingestion workers', 'REST + SDK endpoints'],
      database: ['PostgreSQL (partitioned)', 'Redis (rate limiting + queues)'],
      infrastructure: ['Two Ubuntu VPS nodes', 'Nginx load balancing', 'PM2', 'GitHub Actions'],
      services: ['Cloudflare (edge caching + WAF)', 'Better Stack (monitoring)'],
    },
    results: [
      { value: '38M', metric: 'events/day sustained', description: 'On two 8GB VPS nodes with headroom.' },
      { value: '320ms', metric: 'p95 dashboard query', description: 'Across a full year of event history.' },
      { value: '−78%', metric: 'infrastructure cost', description: 'Compared with the serverless MVP at equal volume.' },
    ],
    gallery: [
      { title: 'Ingestion overview', description: 'Throughput, batch sizes, and back-pressure state.' },
      { title: 'Query console', description: 'Roll-up aware analytics queries with explain plans.' },
      { title: 'API key management', description: 'Quotas, burst limits, and per-key consumption.' },
    ],
    stack: ['Node.js', 'Fastify', 'PostgreSQL', 'Redis', 'Nginx', 'PM2', 'Cloudflare', 'GitHub Actions'],
    liveUrl: null,
    githubUrl: null,
    views: 858,
  },
  {
    slug: 'shipd',
    title: 'shipd',
    tagline: 'Zero-downtime deployments for plain Linux servers',
    description:
      'An open-source CLI that brings heroku-style deployments to any VPS: push code, get atomic releases, health-checked restarts, and instant rollbacks — powered by nothing more exotic than SSH, Nginx, and PM2. Born from setting up the same deployment pipeline for the twentieth time.',
    category: 'OPEN_SOURCE',
    clientType: 'Open source — MIT license',
    year: 2025,
    featured: false,
    sortOrder: 5,
    status: 'PUBLISHED',
    accent: 'violet',
    problem:
      'Every VPS project needs the same plumbing: a deploy user, release directories, environment management, process supervision, Nginx reloads, and a rollback story. Teams either hand-roll fragile bash scripts or adopt heavyweight platforms that hide the server they’re paying for.',
    solution:
      'shipd codifies the boring parts into a single binary-free CLI: `shipd init` provisions a server idempotently, `shipd deploy` builds locally or on-server, uploads an atomic release, runs health checks, and flips a symlink; `shipd rollback` returns to any previous release in seconds. Config lives in one readable TOML file checked into the repo.',
    challenges: [
      {
        title: 'Atomic releases over plain SSH',
        challenge: 'A deploy interrupted mid-transfer must never leave a half-updated application serving traffic.',
        solution:
          'Releases upload to a timestamped directory and are activated by an atomic symlink swap only after health checks pass; PM2 reloads workers one at a time so in-flight requests complete.',
      },
      {
        title: 'Idempotent server provisioning',
        challenge: 'Running setup twice on a hand-configured server should fix drift, not destroy it.',
        solution:
          'Every provisioning step is a declarative check-then-apply operation with a dry-run mode that prints an execution plan, ansible-style, before touching anything.',
      },
    ],
    architecture: {
      frontend: ['Documentation site (Next.js, static export)'],
      backend: ['Node.js CLI', 'SSH orchestration', 'TOML config parser'],
      database: ['None — state lives on the target server'],
      infrastructure: ['Works with Nginx, PM2, systemd', 'GitHub Actions for CI + releases'],
      services: ['npm registry distribution'],
    },
    results: [
      { value: '1.9k', metric: 'GitHub stars', description: 'Adopted by freelancers and small teams.' },
      { value: '<10s', metric: 'rollback time', description: 'Atomic symlink swap plus graceful reload.' },
      { value: '40+', metric: 'contributors', description: 'Community adapters for Bun, Deno, and static sites.' },
    ],
    gallery: [
      { title: 'Deploy pipeline', description: 'Build, upload, health check, atomic activation.' },
      { title: 'CLI experience', description: 'Plan output, progress, and rollback prompts.' },
    ],
    stack: ['Node.js', 'TypeScript', 'Nginx', 'PM2', 'GitHub Actions', 'Linux'],
    liveUrl: 'https://github.com/waqasmani',
    githubUrl: 'https://github.com/waqasmani',
    views: 1521,
  },
  {
    slug: 'ledgerline',
    title: 'Ledgerline',
    tagline: 'Invoicing and payment tracking for freelance studios',
    description:
      'A focused web application that handles the money side of freelancing: quotes that convert to invoices, automatic payment reminders, multi-currency support, and a clean year-end export an accountant actually thanks you for.',
    category: 'WEB_APP',
    clientType: 'Product — bootstrapped',
    year: 2023,
    featured: false,
    sortOrder: 6,
    status: 'PUBLISHED',
    accent: 'rose',
    problem:
      'Small studios lived in a mess of invoice templates, spreadsheet trackers, and awkward payment-chasing emails. Existing tools were either bloated accounting suites or single-currency US-centric apps that fell apart with international clients.',
    solution:
      'Ledgerline models the actual freelance flow — quote, accept, invoice, remind, reconcile — with multi-currency amounts stored in minor units, automatic exchange-rate snapshots at invoice time, and a reminder engine with configurable escalation. Stripe and manual bank-transfer payments reconcile into one ledger.',
    challenges: [
      {
        title: 'Getting money math provably right',
        challenge: 'Floating-point currency handling and mid-flight exchange-rate changes are classic sources of silent corruption.',
        solution:
          'All amounts are integer minor units with currency tagged at the type level; conversion happens only at render time using rates snapshotted when the invoice is issued. Property-based tests hammer the invariants.',
      },
      {
        title: 'Reminders that don’t harm relationships',
        challenge: 'Automated payment chasing can read as aggressive and cost a studio its client.',
        solution:
          'Reminder sequences use configurable tone presets, quiet hours by client timezone, and always pause automatically the moment a payment intent or partial payment is detected.',
      },
    ],
    architecture: {
      frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
      backend: ['Next.js Route Handlers', 'Scheduled jobs (cron)', 'Stripe webhooks'],
      database: ['PostgreSQL', 'Prisma'],
      infrastructure: ['Docker', 'Nginx', 'Hetzner VPS', 'GitHub Actions'],
      services: ['Stripe', 'Resend', 'ECB exchange-rate feed'],
    },
    results: [
      { value: '11 days', metric: 'faster payment', description: 'Median time-to-paid dropped from 31 to 20 days.' },
      { value: '4,000+', metric: 'invoices issued', description: 'Across active studios in the first year.' },
    ],
    gallery: [
      { title: 'Invoice composer', description: 'Line items, taxes, and multi-currency totals.' },
      { title: 'Payments timeline', description: 'Reminders, partial payments, and reconciliation.' },
    ],
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Stripe', 'Docker', 'Nginx'],
    liveUrl: null,
    githubUrl: null,
    views: 644,
  },
];
