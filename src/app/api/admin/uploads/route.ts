import { getApiUser } from '@/lib/auth';
import { jsonError, withErrorHandling } from '@/lib/api';
import { getObject } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Admin-only download of uploaded attachments by storage key. */
export const GET = withErrorHandling('admin/uploads', async (req: Request) => {
  const user = await getApiUser();
  if (!user) return jsonError(401, 'Unauthorized');

  const key = new URL(req.url).searchParams.get('key');
  if (!key || !key.startsWith('uploads/') || key.length > 300) {
    return jsonError(400, 'Invalid key');
  }

  const data = await getObject(key);
  if (!data) return jsonError(404, 'File not found');

  const filename = key.split('-').slice(1).join('-') || 'attachment';
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
