import { NextResponse } from 'next/server';
import { forkStudent, unforkStudent, isForkingUser, getForkCounts } from '@/lib/db/forks';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [isForking, counts] = await Promise.all([
      isForkingUser(id),
      getForkCounts(id),
    ]);

    return NextResponse.json({
      isForking,
      dockersCount: counts.dockersCount,
      dockingCount: counts.dockingCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to get fork status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'You must be signed in to Fork a student.' }, { status: 401 });
    }

    const { id } = await params;
    const result = await forkStudent(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fork student';
    const status = msg.includes('Slow down') || msg.includes('cooldown') || msg.includes('limit') ? 429 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'You must be signed in to Unfork a student.' }, { status: 401 });
    }

    const { id } = await params;
    const result = await unforkStudent(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to unfork student';
    const status = msg.includes('Slow down') || msg.includes('cooldown') || msg.includes('limit') ? 429 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
