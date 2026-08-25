import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { AdminPageTitle } from '@/components/admin/ui';
import { SettingsForm } from '@/components/admin/settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireUser('ADMIN');
  const settings = await getSettings();

  return (
    <>
      <AdminPageTitle
        title="Site Settings"
        description="Availability, identity, chat, socials, and SEO — changes apply to the public site immediately."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
