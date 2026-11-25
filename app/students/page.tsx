import PageHero from '@/components/PageHero';
import StudentsBrowser from '@/components/StudentsBrowser';
import { getPublicStudents } from '@/lib/db/dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Students · CampusHub · UGSOT' };

export default async function StudentsPage() {
  const studentsList = await getPublicStudents();
  return (
    <main className="container page">
      <PageHero
        tag="Builders on campus"
        before="Find your "
        highlight="squad"
        sub="Meet classmates by what they’re into, see who’s looking for a team, and find your next collaborator."
      />
      <StudentsBrowser students={studentsList} />
    </main>
  );
}
