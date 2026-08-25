import { destroyCurrentSession } from '@/lib/auth';
import { jsonOk, withErrorHandling } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling('auth/logout', async () => {
  await destroyCurrentSession();
  return jsonOk();
});
