import { NextResponse } from 'next/server';
import { applyToBeMentor } from '@/lib/db/mentorship';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { bio, skills, areas, availabilitySlots } = body || {};

    if (!bio || !skills || !availabilitySlots || !availabilitySlots.length) {
      return NextResponse.json(
        { error: 'Bio, skills, and availability slots are required.' },
        { status: 400 },
      );
    }

    const mentorId = await applyToBeMentor({
      bio,
      skills: Array.isArray(skills) ? skills : [],
      areas: Array.isArray(areas) ? areas : [],
      availabilitySlots: Array.isArray(availabilitySlots) ? availabilitySlots : [],
    });

    return NextResponse.json({ success: true, mentorId });
  } catch (err) {
    console.error('Error applying for mentorship:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to apply' },
      { status: 500 },
    );
  }
}
