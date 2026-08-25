import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { assistantSchema } from '@/lib/schemas';
import { generateBrief } from '@/lib/assistant';

export const POST = withErrorHandling('assistant', async (req: Request) => {
  const limited = enforceLimit(req, 'assistant', limits.assistant);
  if (limited) return limited;

  const parsed = assistantSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, parsed.error.issues[0]?.message ?? 'Invalid idea');
  }

  // Note: idea text is intentionally never logged — visitors describe
  // confidential plans in here.
  const { brief, engine } = await generateBrief(parsed.data.idea);
  return jsonOk({ brief, engine });
});
