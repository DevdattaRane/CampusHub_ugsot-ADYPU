import Link from 'next/link';
import ProfileView from '@/components/ProfileView';
import SignOutButton from '@/components/auth/SignOutButton';
import Card from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { students } from '@/lib/data';
import type { Student } from '@/lib/types';
import { getMyEventRegistrations, getMyCertificates, type MyEventRegistration, type UserCertificate } from '@/lib/db/events';
import { getMyBookmarkedProjects } from '@/lib/db/projects';
import { getUserDashboardData, type DashboardStats } from '@/lib/db/dashboard';
import type { Project } from '@/lib/types';

export const metadata = { title: 'Your profile · CampusHub · UGSOT' };

export default async function MyProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="container page profile-page">
        <div className="profile-page__heading">
          <Link href="/students" className="back-link">← All students</Link>
          <p className="eyebrow">Your CampusHub profile</p>
          <h1 className="hero__title">Profile access</h1>
          <p className="profile-page__note">Sign in or create an account to view and customize your student profile.</p>
        </div>
        <Card className="card" style={{ maxWidth: 540, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="card__title">Sign in or create an account</h2>
          <p style={{ fontSize: 15, lineHeight: 1.5 }}>
            You are browsing CampusHub as a guest. To build your profile, showcase skills, find teammates, and post in the community, sign in with your email address.
          </p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Link href="/auth/sign-in" className="btn btn--primary">Sign in</Link>
            <Link href="/auth/register" className="btn btn--outline">Create an account</Link>
          </div>
        </Card>
      </main>
    );
  }

  const handle = currentUser.email.split('@')[0];
  const matchedStudent = students.find(
    (s) => s.handle.toLowerCase() === handle.toLowerCase() || s.name.toLowerCase() === currentUser.name.toLowerCase()
  );

  const profileData: Student = matchedStudent ? {
    ...matchedStudent,
    name: currentUser.name || matchedStudent.name,
    bio: currentUser.bio || matchedStudent.bio,
    skills: currentUser.skills && currentUser.skills.length > 0 ? currentUser.skills : matchedStudent.skills,
  } : {
    id: handle,
    name: currentUser.name,
    handle,
    branch: 'CSE',
    year: currentUser.courseYear || '3rd year',
    bio: currentUser.bio || 'Student at UGSOT ADYPU learning, building, and contributing in the open.',
    skills: currentUser.skills && currentUser.skills.length > 0 ? currentUser.skills : ['React', 'TypeScript', 'Git', 'Open Source'],
    lookingForTeam: true,
    links: { linkedin: '', github: currentUser.githubUsername ? `github.com/${currentUser.githubUsername}` : '', x: '', portfolio: '' },
    achievements: [
      { title: 'Joined CampusHub', date: 'Nov 2026', verified: true }
    ],
    going: ['campus-hackathon'],
    profileCompleteness: 85,
  };

  let registrations: MyEventRegistration[] = [];
  let registrationsError = '';
  try {
    registrations = await getMyEventRegistrations();
  } catch (error) {
    console.error('Unable to load the profile event registrations.', error);
    registrationsError = 'Your registrations are temporarily unavailable.';
  }

  let certificates: UserCertificate[] = [];
  try {
    certificates = await getMyCertificates();
  } catch (error) {
    console.error('Unable to load certificates:', error);
  }

  let bookmarkedProjects: Project[] = [];
  try {
    bookmarkedProjects = await getMyBookmarkedProjects();
  } catch (error) {
    console.error('Unable to load bookmarks:', error);
  }

  let dashboardStats: DashboardStats | undefined;
  try {
    dashboardStats = await getUserDashboardData(currentUser.id, currentUser.githubUsername);
  } catch (error) {
    console.error('Unable to load dashboard stats:', error);
  }

  return (
    <main className="container page profile-page">
      <div className="profile-page__heading">
        <Link href="/students" className="back-link">← All students</Link>
        <p className="eyebrow">Your CampusHub profile</p>
        <p className="profile-page__note">Give classmates a quick sense of what you’re learning and building.</p>
        <SignOutButton />
      </div>
      <ProfileView
        student={profileData}
        isOwn
        registrations={registrations}
        registrationsError={registrationsError}
        certificates={certificates}
        bookmarkedProjects={bookmarkedProjects}
        dashboardStats={dashboardStats}
        initialGithubUsername={currentUser.githubUsername}
      />
    </main>
  );
}
