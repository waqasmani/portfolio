/**
 * Zod schemas shared by API routes and client forms — the single contract for
 * every trust boundary. Error copy lives here so forms and API never drift.
 */
import { z } from 'zod';
import { budgetRanges, contactProjectTypes, requestCategories } from '@/config/site';

// ---------------------------------------------------------------------------
// Public forms
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.email('Please enter a valid email address').max(200),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'A short subject helps me reply faster').max(150),
  projectType: z.enum(contactProjectTypes).optional().or(z.literal('')),
  budget: z.enum(budgetRanges).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'Tell me a little more — at least 20 characters')
    .max(5000, 'Please keep it under 5,000 characters'),
  // Honeypot: real users never fill this.
  website: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const attachmentMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  size: z.number().int().min(0).max(25 * 1024 * 1024),
  type: z.string().trim().max(100),
  /** Server-generated storage key (from /api/uploads); admin download handle. */
  key: z.string().trim().max(300).optional(),
});

export const projectRequestSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.email('Please enter a valid email address').max(200),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  title: z.string().trim().min(4, 'Give your project a short title').max(150),
  category: z.enum(requestCategories, { error: 'Pick the closest category' }),
  budget: z.enum(budgetRanges, { error: 'Pick a budget range' }),
  deadline: z.string().trim().max(100).optional().or(z.literal('')),
  technologies: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  description: z
    .string()
    .trim()
    .min(30, 'Describe the project in at least 30 characters')
    .max(8000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  attachments: z.array(attachmentMetaSchema).max(5).default([]),
  aiBrief: z.unknown().optional(),
  website: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
});

export type ProjectRequestInput = z.infer<typeof projectRequestSchema>;

export const assistantSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(20, 'Describe your idea in at least 20 characters')
    .max(2000, 'Please keep the idea under 2,000 characters'),
});

// The structured brief produced by the AI assistant (or heuristic fallback).
export const briefSchema = z.object({
  summary: z.string().max(700),
  requirements: z.array(z.string().max(260)).min(2).max(10),
  features: z.array(z.string().max(260)).min(2).max(12),
  stack: z.array(z.object({ name: z.string().max(40), reason: z.string().max(200) })).min(2).max(8),
  complexity: z.enum(['Simple', 'Moderate', 'Complex', 'Very Complex']),
  phases: z.array(z.object({ title: z.string().max(90), description: z.string().max(340) })).min(2).max(6),
});

export type ProjectBrief = z.infer<typeof briefSchema>;

// ---------------------------------------------------------------------------
// Live chat
// ---------------------------------------------------------------------------

export const chatStartSchema = z.object({
  visitorId: z.string().trim().min(8).max(64),
  name: z.string().trim().min(2, 'Please share your name').max(100),
  email: z.email('Please enter a valid email').max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Write a message to start').max(2000),
  pageUrl: z.string().trim().max(300).optional(),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().trim().min(8).max(64),
  visitorId: z.string().trim().min(8).max(64).optional(),
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000),
  attachment: attachmentMetaSchema.optional(),
});

export const chatTypingSchema = z.object({
  conversationId: z.string().trim().min(8).max(64),
  visitorId: z.string().trim().min(8).max(64).optional(),
  role: z.enum(['visitor', 'admin']),
});

// ---------------------------------------------------------------------------
// Analytics beacon
// ---------------------------------------------------------------------------

export const trackSchema = z.object({
  type: z.enum(['pageview', 'event']),
  name: z
    .enum([
      'contact_submitted',
      'project_request_submitted',
      'resume_downloaded',
      'chat_started',
      'demo_clicked',
      'github_clicked',
    ])
    .optional(),
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(500).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

// ---------------------------------------------------------------------------
// Admin: content management
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers, and hyphens only');

export const projectUpsertSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(4).max(200),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(['WEB_APP', 'SAAS', 'ECOMMERCE', 'CRM', 'API', 'OPEN_SOURCE']),
  clientType: z.string().trim().max(120).optional().or(z.literal('')),
  year: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  accent: z.string().trim().max(30).default('indigo'),
  problem: z.string().trim().max(4000).optional().or(z.literal('')),
  solution: z.string().trim().max(4000).optional().or(z.literal('')),
  challenges: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(150),
        challenge: z.string().trim().min(1).max(1200),
        solution: z.string().trim().min(1).max(1200),
      })
    )
    .max(8)
    .default([]),
  architecture: z
    .object({
      frontend: z.array(z.string().max(80)).max(10).default([]),
      backend: z.array(z.string().max(80)).max(10).default([]),
      database: z.array(z.string().max(80)).max(10).default([]),
      infrastructure: z.array(z.string().max(80)).max(10).default([]),
      services: z.array(z.string().max(80)).max(10).default([]),
    })
    .default({ frontend: [], backend: [], database: [], infrastructure: [], services: [] }),
  results: z
    .array(
      z.object({
        value: z.string().trim().min(1).max(20),
        metric: z.string().trim().min(1).max(80),
        description: z.string().trim().max(200).default(''),
      })
    )
    .max(8)
    .default([]),
  gallery: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(300).default(''),
      })
    )
    .max(10)
    .default([]),
  stack: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  liveUrl: z.url('Must be a valid URL').max(300).optional().or(z.literal('')).nullable(),
  githubUrl: z.url('Must be a valid URL').max(300).optional().or(z.literal('')).nullable(),
});

export type ProjectUpsertInput = z.infer<typeof projectUpsertSchema>;

export const postUpsertSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(160),
  excerpt: z.string().trim().min(10).max(400),
  content: z.string().trim().min(50, 'Articles need at least 50 characters').max(120_000),
  category: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  accent: z.string().trim().max(30).default('indigo'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(300).optional().or(z.literal('')),
  scheduledFor: z.iso.datetime({ offset: true }).optional().nullable(),
});

export type PostUpsertInput = z.infer<typeof postUpsertSchema>;

export const testimonialUpsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  company: z.string().trim().min(1).max(120),
  quote: z.string().trim().min(10).max(1200),
  projectName: z.string().trim().max(120).optional().or(z.literal('')),
  avatarSeed: z.string().trim().max(40).default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});

export const inquiryStatusSchema = z
  .object({
    status: z
      .enum(['NEW', 'REVIEWING', 'CONTACTED', 'PROPOSAL_SENT', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'])
      .optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, {
    message: 'Nothing to update',
  });

export const messageStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

// ---------------------------------------------------------------------------
// Admin: site settings (stored as JSON, validated at the edges)
// ---------------------------------------------------------------------------

export const settingsSchema = z.object({
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']),
  availabilityNote: z.string().trim().max(200),
  nextAvailableDate: z.string().trim().max(60),
  preferredProjects: z.array(z.string().trim().min(1).max(80)).max(8),
  responseTime: z.string().trim().max(80),
  chatOnline: z.boolean(),
  chatOfflineMessage: z.string().trim().max(400),
  developerName: z.string().trim().min(1).max(100),
  developerTitle: z.string().trim().min(1).max(120),
  developerEmail: z.email().max(200),
  location: z.string().trim().max(120),
  timezone: z.string().trim().max(60),
  resumePath: z.string().trim().max(300),
  socials: z.record(z.string().max(40), z.string().max(300)),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
