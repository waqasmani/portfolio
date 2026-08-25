import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Seeds run from the project root via the Prisma CLI.
const postsDir = join(process.cwd(), 'prisma', 'seed-data', 'posts');

function md(file: string): string {
  return readFileSync(join(postsDir, file), 'utf8');
}

export interface PostSeed {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  accent: string;
  featured: boolean;
  views: number;
  publishedDaysAgo: number;
  seoDescription?: string;
}

export const posts: PostSeed[] = [
  {
    slug: 'streaming-realtime-ui-server-sent-events-nextjs',
    title: 'Streaming Real-Time UI with Server-Sent Events in Next.js',
    excerpt:
      'WebSockets are overkill for most real-time features. Here is the SSE architecture behind this site’s live chat — heartbeats, reconnection, and Nginx configuration included.',
    content: md('streaming-realtime-ui-server-sent-events-nextjs.md'),
    category: 'Next.js',
    tags: ['Next.js', 'SSE', 'Real-Time', 'Architecture'],
    accent: 'indigo',
    featured: true,
    views: 4831,
    publishedDaysAgo: 9,
  },
  {
    slug: 'postgresql-indexing-strategies',
    title: 'PostgreSQL Indexing Strategies I Reach For First',
    excerpt:
      'A working checklist for slow queries: reading EXPLAIN honestly, composite index column order, partial and covering indexes, and when BRIN or GIN beat B-tree.',
    content: md('postgresql-indexing-strategies.md'),
    category: 'Databases',
    tags: ['PostgreSQL', 'Performance', 'SQL', 'Indexing'],
    accent: 'sky',
    featured: false,
    views: 6210,
    publishedDaysAgo: 24,
  },
  {
    slug: 'zero-downtime-deployments-vps-nginx-pm2',
    title: 'Zero-Downtime Deployments on a $10 VPS with Nginx and PM2',
    excerpt:
      'Atomic releases, health-checked restarts, and ten-second rollbacks — grown-up deployments without Kubernetes, using a symlink, PM2 cluster mode, and expand-only migrations.',
    content: md('zero-downtime-deployments-vps-nginx-pm2.md'),
    category: 'DevOps',
    tags: ['DevOps', 'Nginx', 'PM2', 'Deployment', 'Linux'],
    accent: 'emerald',
    featured: false,
    views: 7502,
    publishedDaysAgo: 41,
  },
  {
    slug: 'type-safe-api-boundaries-zod',
    title: 'Type-Safe API Boundaries with Zod',
    excerpt:
      'TypeScript types vanish at runtime. One schema per boundary — shared by form and API, with coercion, resource limits, and defaults — is the contract that keeps them honest.',
    content: md('type-safe-api-boundaries-zod.md'),
    category: 'Web Development',
    tags: ['TypeScript', 'Zod', 'API Design', 'Validation'],
    accent: 'violet',
    featured: false,
    views: 3966,
    publishedDaysAgo: 58,
  },
  {
    slug: 'react-server-components-mental-model',
    title: 'React Server Components: A Mental Model That Finally Clicks',
    excerpt:
      '“Does this UI ever change without a request?” — one question that sorts every component, plus the children-through-the-door pattern that keeps bundles small.',
    content: md('react-server-components-mental-model.md'),
    category: 'React',
    tags: ['React', 'RSC', 'Next.js', 'Performance'],
    accent: 'rose',
    featured: false,
    views: 5388,
    publishedDaysAgo: 73,
  },
  {
    slug: 'rate-limiting-node-apis',
    title: 'Rate Limiting Node.js APIs: Token Buckets Done Properly',
    excerpt:
      'A complete token-bucket limiter in 30 lines, choosing keys that are fair, answering 429s that teach clients to behave, and when to graduate to Redis.',
    content: md('rate-limiting-node-apis.md'),
    category: 'Node.js',
    tags: ['Node.js', 'Security', 'API Design', 'Redis'],
    accent: 'amber',
    featured: false,
    views: 2914,
    publishedDaysAgo: 96,
  },
  {
    slug: 'ai-project-scoping-assistant-claude',
    title: 'Building an AI Project-Scoping Assistant with the Claude API',
    excerpt:
      'How the AI assistant on my project request form turns three vague sentences into structured requirements — forced tool calls, schema validation, prompt-injection defence, and graceful fallback.',
    content: md('ai-project-scoping-assistant-claude.md'),
    category: 'AI Development',
    tags: ['AI', 'Claude API', 'TypeScript', 'Product'],
    accent: 'indigo',
    featured: false,
    views: 3407,
    publishedDaysAgo: 3,
  },
];
