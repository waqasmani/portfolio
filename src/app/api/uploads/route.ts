import { enforceLimit, jsonError, jsonOk, withErrorHandling } from '@/lib/api';
import { limits } from '@/lib/rate-limit';
import { isAllowedUploadType, makeStorageKey, putObject, uploadLimits } from '@/lib/storage';

/**
 * Attachment upload for project requests. Accepts one file per call as
 * multipart form data; returns the storage key referenced in the request's
 * attachments metadata. Files are only retrievable through the
 * authenticated admin download route.
 */
export const POST = withErrorHandling('uploads', async (req: Request) => {
  const limited = enforceLimit(req, 'uploads', limits.form);
  if (limited) return limited;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) return jsonError(422, 'No file provided');

  if (file.size === 0) return jsonError(422, 'File is empty');
  if (file.size > uploadLimits.maxBytes) {
    return jsonError(413, 'File is too large (5 MB maximum)');
  }
  if (!isAllowedUploadType(file.type)) {
    return jsonError(415, 'File type not supported (PDF, images, text, zip, doc, csv)');
  }

  const key = makeStorageKey(file.name || 'attachment');
  await putObject(key, Buffer.from(await file.arrayBuffer()), file.type);

  return jsonOk({
    key,
    name: (file.name || 'attachment').slice(0, 200),
    size: file.size,
    type: file.type,
  });
});
