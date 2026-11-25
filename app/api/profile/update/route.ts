import { NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/db/dashboard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, githubUsername, skills, bio } = body;

    // Reject if any attempt to alter role
    if ('role' in body) {
      return NextResponse.json(
        { error: 'Unauthorized: You cannot alter your role.' },
        { status: 403 },
      );
    }

    await updateUserProfile({
      fullName,
      githubUsername,
      skills,
      bio,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
