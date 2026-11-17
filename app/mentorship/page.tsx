import PageHero from '@/components/PageHero';
import MentorshipView from '@/components/MentorshipView';
import { getCurrentUser } from '@/lib/auth';
import { getMentors, getMySessions, getCodeReviews, getMyMentorProfile } from '@/lib/db/mentorship';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mentorship & Code Reviews · CampusHub · UGSOT' };

export default async function MentorshipPage() {
  const currentUser = await getCurrentUser();
  const [mentors, sessions, reviews, myMentorProfile] = await Promise.all([
    getMentors(),
    getMySessions(),
    getCodeReviews(),
    getMyMentorProfile(),
  ]);

  return (
    <main className="container page page--narrow">
      <PageHero
        tag="Guidance · 1:1 Sessions · Code Reviews"
        before="Peer & Senior "
        highlight="Mentorship"
        sub="Book 1-on-1 sessions with verified senior mentors, get constructive code reviews, and fast-track your tech career."
      />
      <div style={{ marginTop: 24 }}>
        <MentorshipView
          initialMentors={mentors}
          initialSessions={sessions}
          initialReviews={reviews}
          myMentorProfile={myMentorProfile}
          currentUser={currentUser}
        />
      </div>
    </main>
  );
}
