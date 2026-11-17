import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { getPublicStudentById } from '@/lib/db/dashboard';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getPublicStudentById(id);
  return { title: s ? `${s.name} · CampusHub · UGSOT` : 'Student not found · CampusHub · UGSOT' };
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getPublicStudentById(id);
  if (!student) notFound();

  const currentUser = await getCurrentUser();
  const isOwn = currentUser ? currentUser.id === student.id : false;

  return (
    <main className="container page" style={{ gap: 12 }}>
      <Link href="/students" className="back-link">← All students</Link>
      <ProfileView key={student.id} student={student} isOwn={isOwn} />
    </main>
  );
}
