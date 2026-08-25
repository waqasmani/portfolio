import { z } from 'zod';
import { getApiUser } from '@/lib/auth';
import { jsonError, jsonOk, readJson, withErrorHandling } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

const schema = z.object({ markdown: z.string().max(120_000) });

/** Admin: render markdown to HTML with the same pipeline the blog uses. */
export const POST = withErrorHandling('admin/preview', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(422, 'Invalid payload');

  const { html } = await renderMarkdown(parsed.data.markdown);
  return jsonOk({ html });
});
