import PageHero from '@/components/PageHero';
import ProjectList from '@/components/ProjectList';
import { getCurrentUser } from '@/lib/auth';
import { getProjects } from '@/lib/db/projects';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Project Showcase · CampusHub · UGSOT',
  description: 'Explore student projects, tech stacks, live demos, and open collaboration opportunities at UGSOT ADYPU.',
};

export default async function ProjectsPage() {
  const currentUser = await getCurrentUser();
  const initialProjects = await getProjects();

  return (
    <main className="container page">
      <PageHero
        tag="Build · Ship · Collaborate"
        before="Student "
        highlight="Project Showcase"
        sub="Discover what UGSOT students are engineering. Check out live demos, open-source repos, and team up on new builds."
      />
      <div style={{ marginTop: 24 }}>
        <ProjectList initialProjects={initialProjects} currentUser={currentUser} />
      </div>
    </main>
  );
}
