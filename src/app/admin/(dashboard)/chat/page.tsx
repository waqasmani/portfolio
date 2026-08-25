import { requireUser } from '@/lib/auth';
import { AdminPageTitle } from '@/components/admin/ui';
import { AdminChat } from '@/components/admin/admin-chat';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminChatPage() {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);

  return (
    <>
      <AdminPageTitle
        title="Live Chat"
        description={
          settings.chatOnline
            ? 'You are shown as online — visitors expect quick replies.'
            : 'You are shown as away — the assistant answers common questions for you.'
        }
      />
      <AdminChat currentUser={{ id: user.id, name: user.name }} />
    </>
  );
}
