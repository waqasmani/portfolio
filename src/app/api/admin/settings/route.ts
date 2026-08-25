import { z } from 'zod';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { settingsSchema } from '@/lib/schemas';
import { getSettings, updateSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling('admin/settings get', async () => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');
  return jsonOk({ settings: await getSettings() });
});

export const PUT = withErrorHandling('admin/settings put', async (req: Request) => {
  const user = await getApiUser('ADMIN');
  if (!user) return jsonError(401, 'Unauthorized');

  const parsed = settingsSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError(422, 'Please fix the highlighted fields.', {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const settings = await updateSettings(parsed.data);
  return jsonOk({ settings });
});
