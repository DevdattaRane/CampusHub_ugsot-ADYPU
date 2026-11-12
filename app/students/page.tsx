import PageHero from '@/components/PageHero';
import StudentsBrowser from '@/components/StudentsBrowser';
import { students } from '@/lib/data';

export const metadata = { title: 'Students · UGSOTADYPU Hub' };

export default function StudentsPage() {
  return (
    <main className="container page">
      <PageHero
        tag="Builders on campus"
        before="Find your "
        highlight="squad"
        sub="Search classmates by skill, and see who’s looking for a team."
      />
      <StudentsBrowser students={students} />
    </main>
  );
}
