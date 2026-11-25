import { redirect } from 'next/navigation';
import PageHero from '@/components/PageHero';
import NotificationsView from '@/components/NotificationsView';
import { getCurrentUser } from '@/lib/auth';
import { getMyNotifications, getNotificationPreferences } from '@/lib/db/notifications';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Notifications · CampusHub · UGSOT',
  description: 'View your real-time campus notifications, team invites, and activity updates.',
};

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/sign-in');
  }

  const initialNotifications = await getMyNotifications();
  const initialPreferences = await getNotificationPreferences();

  return (
    <main className="container page">
      <PageHero
        tag="Updates · Invites · Activity"
        before="Your "
        highlight="Notifications"
        sub="Stay informed on team invites, event updates, mentorship sessions, and community activity."
      />
      <div style={{ marginTop: 24 }}>
        <NotificationsView
          initialNotifications={initialNotifications}
          initialPreferences={initialPreferences}
        />
      </div>
    </main>
  );
}
