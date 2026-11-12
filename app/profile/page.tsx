import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { CURRENT_USER_ID, getStudent } from '@/lib/data';

export const metadata = { title: 'Your profile · CampusHub · UGSOT' };

export default function MyProfilePage() {
  // Replace with the signed-in user once auth is added.
  const me = getStudent(CURRENT_USER_ID);
  if (!me) notFound();

  return (
    <main className="container page profile-page">
      <div className="profile-page__heading">
        <Link href="/students" className="back-link">← All students</Link>
        <p className="eyebrow">Your CampusHub profile</p>
        <p className="profile-page__note">Give classmates a quick sense of what you’re learning and building.</p>
      </div>
      <ProfileView student={me} isOwn />
    </main>
  );
}
