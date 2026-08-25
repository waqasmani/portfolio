/**
 * Database seed: idempotent — safe to run repeatedly.
 *
 *   npx prisma db seed
 *
 * Creates the initial admin user (credentials from SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD), default site settings, and realistic demo content:
 * projects with full case studies, blog articles, testimonials, and a light
 * backfill of analytics so the admin dashboard demonstrates its charts.
 */
import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client';
import { defaultSettings } from '../src/config/site';
import { projects } from './seed-data/projects';
import { posts } from './seed-data/posts';
import { testimonials } from './seed-data/testimonials';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DAY = 24 * 60 * 60 * 1000;

function readingTime(markdown: string): number {
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin12345';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'CustomerFlow', passwordHash, role: 'ADMIN' },
  });
  console.log(`✔ Admin user ready: ${email}`);
  return user;
}

async function seedSettings() {
  await db.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, data: defaultSettings as unknown as Prisma.InputJsonValue },
  });
  console.log('✔ Site settings ready');
}

async function seedProjects() {
  for (const project of projects) {
    const { views, ...data } = project;
    await db.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: {
        ...data,
        views,
        publishedAt: new Date(Date.now() - (data.sortOrder ?? 1) * 30 * DAY),
      },
    });
  }
  console.log(`✔ ${projects.length} projects ready`);
}

async function seedPosts(authorId: string) {
  for (const post of posts) {
    const { publishedDaysAgo, ...data } = post;
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...data,
        status: 'PUBLISHED',
        readingTime: readingTime(post.content),
        publishedAt: new Date(Date.now() - publishedDaysAgo * DAY),
        authorId,
        seoDescription: post.seoDescription ?? post.excerpt,
      },
    });
  }
  console.log(`✔ ${posts.length} blog posts ready`);
}

async function seedTestimonials() {
  const count = await db.testimonial.count();
  if (count > 0) {
    console.log('✔ Testimonials already present');
    return;
  }
  await db.testimonial.createMany({ data: testimonials });
  console.log(`✔ ${testimonials.length} testimonials ready`);
}

async function seedInbox() {
  const existing = await db.contactMessage.count();
  if (existing > 0) return;

  await db.contactMessage.createMany({
    data: [
      {
        name: 'Elena Kovacs',
        email: 'elena@brightpath.example',
        company: 'Brightpath Learning',
        subject: 'Rebuild of our course platform',
        projectType: 'SaaS Platform',
        budget: '$10,000 – $25,000',
        message:
          'We run an online learning platform on aging WordPress plugins and are ready for a proper rebuild. Around 4,000 active students, video content, quizzes, and certificates. Would love to talk about a phased migration — our busy season starts in June.',
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * DAY),
      },
      {
        name: 'James Park',
        email: 'jpark@stackline.example',
        company: 'Stackline Logistics',
        subject: 'API integration between our WMS and carriers',
        projectType: 'API / Backend',
        budget: '$2,000 – $5,000',
        message:
          'We need our warehouse management system connected to three carrier APIs (label purchase, tracking webhooks). Volume is about 1,200 shipments/day. Do you take on integration-only projects?',
        status: 'READ',
        createdAt: new Date(Date.now() - 6 * DAY),
      },
    ],
  });

  await db.projectRequest.createMany({
    data: [
      {
        name: 'Nadia Osei',
        email: 'nadia@harborcraft.example',
        company: 'Harborcraft Studio',
        title: 'Client portal with proofing and approvals',
        category: 'Web Application',
        budget: '$5,000 – $10,000',
        deadline: 'Within 3 months',
        technologies: ['Next.js', 'PostgreSQL'],
        description:
          'Design studio needs a portal where clients review deliverables, leave pinned comments on images, and approve milestones. Roughly 30 active clients. Email notifications on activity. We have brand guidelines ready.',
        priority: 'NORMAL',
        status: 'REVIEWING',
        createdAt: new Date(Date.now() - 4 * DAY),
      },
      {
        name: 'Oliver Grant',
        email: 'oliver@grantandco.example',
        company: null,
        title: 'Automated invoice reconciliation script',
        category: 'Automation Tool',
        budget: '$500 – $2,000',
        deadline: 'Flexible',
        technologies: ['Node.js'],
        description:
          'Every month I download CSV statements from two banks and match them against invoices in a spreadsheet by hand. I want a script that does the matching, flags exceptions, and produces a summary. Happy to walk through my current process on a call.',
        priority: 'LOW',
        status: 'NEW',
        createdAt: new Date(Date.now() - 1 * DAY),
      },
    ],
  });
  console.log('✔ Sample inbox ready (2 messages, 2 project requests)');
}

async function seedChat() {
  const existing = await db.chatConversation.count();
  if (existing > 0) return;

  const conversation = await db.chatConversation.create({
    data: {
      visitorId: randomUUID(),
      visitorName: 'Maya Lindqvist',
      visitorEmail: 'maya@nordicware.example',
      status: 'OPEN',
      pageUrl: '/projects/northwind-ops',
      lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3.2 * 60 * 60 * 1000),
    },
  });

  await db.chatMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        sender: 'VISITOR',
        content: 'Hi! I was reading the Northwind Ops case study — we have a very similar warehouse setup. Is the stock sync approach something you could adapt for us?',
        createdAt: new Date(Date.now() - 3.2 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation.id,
        sender: 'BOT',
        content:
          "Thanks for reaching out! I'm away from my desk right now — leave your questions here and I'll get back to you within 24 hours.",
        createdAt: new Date(Date.now() - 3.19 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation.id,
        sender: 'VISITOR',
        content: 'Great — we run 4 warehouses on a legacy ERP. Main pain point is stock accuracy. Budget around $30k for phase one. maya@nordicware.example',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ],
  });
  console.log('✔ Sample chat conversation ready');
}

/** Light 30-day analytics backfill so charts demonstrate themselves. */
async function seedAnalytics() {
  const existing = await db.analyticsEvent.count();
  if (existing > 0) return;

  const paths = [
    { path: '/', weight: 32 },
    { path: '/projects', weight: 14 },
    { path: '/projects/northwind-ops', weight: 9 },
    { path: '/projects/shipd', weight: 7 },
    { path: '/projects/pulse-api', weight: 5 },
    { path: '/blog', weight: 10 },
    { path: '/blog/zero-downtime-deployments-vps-nginx-pm2', weight: 8 },
    { path: '/blog/postgresql-indexing-strategies', weight: 6 },
    { path: '/services', weight: 6 },
    { path: '/about', weight: 5 },
    { path: '/contact', weight: 4 },
    { path: '/custom-development', weight: 4 },
  ];
  const referrers = ['https://www.google.com/', 'https://github.com/', 'https://news.ycombinator.com/', 'https://www.linkedin.com/', null, null, null];
  const devices = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
  const browsers = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
  const countries = ['US', 'GB', 'DE', 'PK', 'IN', 'NL', 'CA', 'AU', 'FR', 'AE'];
  const conversions: Array<{ name: string; weight: number }> = [
    { name: 'contact_submitted', weight: 2 },
    { name: 'project_request_submitted', weight: 1 },
    { name: 'resume_downloaded', weight: 3 },
    { name: 'chat_started', weight: 2 },
    { name: 'demo_clicked', weight: 4 },
  ];

  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const weighted = <T extends { weight: number }>(arr: readonly T[]): T => {
    const total = arr.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of arr) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return arr[arr.length - 1];
  };

  const events: Array<{
    type: string; name: string | null; path: string; referrer: string | null;
    country: string; device: string; browser: string; visitorHash: string; createdAt: Date;
  }> = [];

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    // Weekday traffic higher than weekends, with mild growth over the month.
    const date = new Date(Date.now() - daysAgo * DAY);
    const isWeekend = [0, 6].includes(date.getDay());
    const base = (isWeekend ? 26 : 48) + Math.round((30 - daysAgo) * 0.9);
    const visitors = base + Math.floor(Math.random() * 14);

    for (let v = 0; v < visitors; v++) {
      const visitorHash = createHash('sha256')
        .update(`${daysAgo}-${v}-${Math.floor(Math.random() * 6)}`)
        .digest('hex')
        .slice(0, 24);
      const device = pick(devices);
      const browser = pick(browsers);
      const country = pick(countries);
      const referrer = pick(referrers);
      const pageCount = 1 + Math.floor(Math.random() * 3);

      for (let p = 0; p < pageCount; p++) {
        const at = new Date(date.getTime() - Math.floor(Math.random() * DAY * 0.6));
        events.push({
          type: 'pageview',
          name: null,
          path: weighted(paths).path,
          referrer: p === 0 ? referrer : null,
          country, device, browser, visitorHash, createdAt: at,
        });
      }
      if (Math.random() < 0.055) {
        events.push({
          type: 'event',
          name: weighted(conversions).name,
          path: weighted(paths).path,
          referrer: null,
          country, device, browser, visitorHash,
          createdAt: new Date(date.getTime() - Math.floor(Math.random() * DAY * 0.5)),
        });
      }
    }
  }

  await db.analyticsEvent.createMany({ data: events });
  console.log(`✔ Analytics backfill ready (${events.length} events)`);
}

async function main() {
  const admin = await seedAdmin();
  await seedSettings();
  await seedProjects();
  await seedPosts(admin.id);
  await seedTestimonials();
  await seedInbox();
  await seedChat();
  await seedAnalytics();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
