import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { contactSchema } from '@/lib/schemas';
import { track } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export const POST = withErrorHandling('contact', async (req: Request) => {
  const limited = enforceLimit(req, 'contact', limits.form);
  if (limited) return limited;

  const parsed = contactSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const { website, ...data } = parsed.data;
  // Honeypot tripped: pretend success, store nothing.
  if (website) return jsonOk();

  const message = await db.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company || null,
      subject: data.subject,
      projectType: data.projectType || null,
      budget: data.budget || null,
      message: data.message,
    },
  });

  logger.info('Contact message received', { id: message.id });
  await track(req, { type: 'event', name: 'contact_submitted', path: '/contact' });

  return jsonOk({ id: message.id });
});
