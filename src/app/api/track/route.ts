import { enforceLimit, jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { trackSchema } from '@/lib/schemas';
import { track } from '@/lib/analytics';

export const POST = withErrorHandling('track', async (req: Request) => {
  const limited = enforceLimit(req, 'track', limits.beacon);
  if (limited) return limited;

  const parsed = trackSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');

  const { type, name, path, referrer } = parsed.data;
  // Never record admin surfaces.
  if (path.startsWith('/admin')) return jsonOk();

  await track(req, { type, name, path, referrer: referrer || undefined });
  return jsonOk();
});
