import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { CURRENT_USER_ID, getStudent, students } from '@/lib/data';

export function generateStaticParams() {
  return students.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getStudent(id);
  return { title: s ? `${s.name} · CampusHub · UGSOT` : 'Student not found · CampusHub · UGSOT' };
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = getStudent(id);
  if (!student) notFound();

  return (
    <main className="container page" style={{ gap: 12 }}>
      <Link href="/students" className="back-link">← All students</Link>
      <ProfileView key={student.id} student={student} isOwn={student.id === CURRENT_USER_ID} />
    </main>
  );
}
