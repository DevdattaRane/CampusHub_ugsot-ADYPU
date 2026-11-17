import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ModerationView from '@/components/ModerationView';
import { getCurrentUser } from '@/lib/auth';
import { getReports, getModerationLogs } from '@/lib/db/moderation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Moderation Desk · CampusHub · UGSOT',
  description: 'Organizer and administrator portal for community moderation, reports, and spam controls.',
};

export default async function ModerationPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/sign-in');
  }

  if (currentUser.role !== 'organizer') {
    return (
      <main className="container page">
        <PageHero
          tag="Access Restricted"
          before="Moderation "
          highlight="Desk"
          sub="This portal is reserved strictly for verified campus organizers and faculty administrators."
        />
        <div className="card" style={{ padding: 32, maxWidth: 480, margin: '24px auto', textAlign: 'center', border: '2px solid #111', borderRadius: 4 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Organizer Privileges Required</h2>
          <p style={{ fontSize: 14, color: '#555', margin: '8px 0 16px 0' }}>
            Only accounts with the <code>organizer</code> role can access moderation reports, audit logs, and spam protections.
          </p>
          <Link href="/" className="btn btn--primary">
            Return to CampusHub Home
          </Link>
        </div>
      </main>
    );
  }

  const initialReports = await getReports();
  const initialLogs = await getModerationLogs();

  return (
    <main className="container page">
      <PageHero
        tag="Security · Moderation · Trust & Safety"
        before="Campus "
        highlight="Moderation Desk"
        sub="Review community reports, manage content soft-deletions, and audit moderation interventions."
      />
      <div style={{ marginTop: 24 }}>
        <ModerationView initialReports={initialReports} initialLogs={initialLogs} />
      </div>
    </main>
  );
}
