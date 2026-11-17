import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProjectById } from '@/lib/db/projects';
import ProjectDetailView from '@/components/ProjectDetailView';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await getProjectById(id);
  return {
    title: data ? `${data.project.title} · CampusHub Projects` : 'Project Details · CampusHub',
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const data = await getProjectById(id);
  if (!data) notFound();

  const currentUser = await getCurrentUser();

  return (
    <main className="container page project-detail-page">
      <ProjectDetailView
        initialProject={data.project}
        initialComments={data.comments}
        initialRequests={data.collaborationRequests}
        githubStats={data.githubStats}
        currentUser={currentUser}
      />
    </main>
  );
}
