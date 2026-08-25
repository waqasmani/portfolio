import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { briefSchema, projectRequestSchema } from '@/lib/schemas';
import { track } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import type { Prisma } from '@/generated/prisma/client';

export const POST = withErrorHandling('requests', async (req: Request) => {
  const limited = enforceLimit(req, 'requests', limits.form);
  if (limited) return limited;

  const parsed = projectRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const { website, aiBrief, ...data } = parsed.data;
  if (website) return jsonOk(); // honeypot

  // Only store the brief if it matches the expected structure exactly.
  const validBrief = aiBrief ? briefSchema.safeParse(aiBrief) : null;

  const request = await db.projectRequest.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company || null,
      title: data.title,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline || null,
      technologies: data.technologies,
      description: data.description,
      priority: data.priority,
      attachments: data.attachments.length > 0 ? (data.attachments as Prisma.InputJsonValue) : undefined,
      aiBrief: validBrief?.success ? (validBrief.data as Prisma.InputJsonValue) : undefined,
    },
  });

  logger.info('Project request received', { id: request.id, category: data.category });
  await track(req, { type: 'event', name: 'project_request_submitted', path: '/custom-development' });

  return jsonOk({ id: request.id });
});
