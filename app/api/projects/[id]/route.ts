import { NextResponse } from 'next/server';
import { deleteProject, getProjectById, updateProject } from '@/lib/db/projects';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const data = await getProjectById(id);
    if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching project:', err);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    await updateProject(id, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating project:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update project' },
      { status: 403 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete project' },
      { status: 403 },
    );
  }
}
