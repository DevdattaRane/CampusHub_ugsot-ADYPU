import { NextResponse } from 'next/server';
import { createProject, getProjects } from '@/lib/db/projects';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tech = searchParams.get('tech') || undefined;
  const collab = searchParams.get('collab') === 'true';
  const search = searchParams.get('search') || undefined;

  try {
    const projects = await getProjects({
      tech,
      lookingForCollaborators: collab || undefined,
      search,
    });
    return NextResponse.json({ projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const {
      title,
      shortDescription,
      description,
      techStack,
      githubUrl,
      demoUrl,
      imageUrl,
      lookingForCollaborators,
      rolesNeeded,
    } = body as {
      title: string;
      shortDescription: string;
      description: string;
      techStack: string[];
      githubUrl?: string;
      demoUrl?: string;
      imageUrl?: string;
      lookingForCollaborators: boolean;
      rolesNeeded: string[];
    };

    if (!title || !shortDescription || !description) {
      return NextResponse.json(
        { error: 'Title, short description, and full description are required' },
        { status: 400 },
      );
    }

    const projectId = await createProject({
      title,
      shortDescription,
      description,
      techStack: Array.isArray(techStack) ? techStack : [],
      githubUrl,
      demoUrl,
      imageUrl,
      lookingForCollaborators: Boolean(lookingForCollaborators),
      rolesNeeded: Array.isArray(rolesNeeded) ? rolesNeeded : [],
    });

    return NextResponse.json({ success: true, projectId });
  } catch (err) {
    console.error('Error creating project:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create project' },
      { status: 500 },
    );
  }
}
