import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from './notifications';
import type { CodeReview, MentorProfile, MentorshipSession } from '@/lib/types';

// Sample fallback mentors
const SAMPLE_MENTORS: MentorProfile[] = [
  {
    id: 'sample-mentor-1',
    userId: 'rohan-user-id',
    name: 'Rohan Deshmukh',
    email: 'rohan@adypu.edu.in',
    bio: '4th year CSE student & incoming SDE intern. Experienced in Go, Docker, distributed backend systems, and open-source contributions.',
    skills: ['Go', 'Docker', 'Kubernetes', 'Backend Architecture', 'Git'],
    areas: ['Backend Systems', 'Open Source', 'Internship Prep'],
    availabilitySlots: [
      'Monday 5:00 PM - 6:00 PM',
      'Wednesday 4:00 PM - 5:00 PM',
      'Saturday 11:00 AM - 12:00 PM',
    ],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-mentor-2',
    userId: 'sneha-user-id',
    name: 'Sneha Kulkarni',
    email: 'sneha@adypu.edu.in',
    bio: 'AI & Data Science senior with multiple hackathon wins. Specializing in computer vision, PyTorch, and deploying models to cloud backends.',
    skills: ['Python', 'PyTorch', 'Data Science', 'Machine Learning', 'API Design'],
    areas: ['ML Pipelines', 'Hackathon Strategy', 'Research Papers'],
    availabilitySlots: [
      'Tuesday 6:00 PM - 7:00 PM',
      'Thursday 5:00 PM - 6:00 PM',
      'Sunday 2:00 PM - 3:00 PM',
    ],
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
];

// Sample fallback code reviews
const SAMPLE_REVIEWS: CodeReview[] = [
  {
    id: 'sample-rev-1',
    requesterId: 'student-1',
    requesterName: 'Aarav Patil',
    requesterEmail: 'student@adypu.edu.in',
    title: 'Review my custom debounce and throttle hook in React 19',
    githubUrl: 'https://github.com/campus-hub/hooks-library',
    codeSnippet: `function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}`,
    language: 'TypeScript',
    notes: 'Checking if there are any race conditions when unmounting during rapid input updates.',
    mentorId: 'sample-mentor-1',
    mentorName: 'Rohan Deshmukh',
    feedback: 'Your cleanup return is correct! For React 19, consider useDeferredValue if you are debouncing user-driven UI transitions.',
    status: 'reviewed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function getMentors(skillFilter?: string): Promise<MentorProfile[]> {
  if (!isSupabaseConfigured()) {
    return filterSampleMentors(skillFilter);
  }

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from('mentor_profiles').select('*').eq('status', 'approved');

    if (skillFilter && skillFilter !== 'All') {
      query = query.contains('skills', [skillFilter]);
    }

    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) {
      return filterSampleMentors(skillFilter);
    }

    const userIds = rows.map((r) => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((r) => {
      const p = profMap.get(r.user_id);
      return {
        id: r.id,
        userId: r.user_id,
        name: p?.full_name?.trim() || p?.email?.split('@')[0] || 'Mentor',
        email: p?.email || '',
        bio: r.bio,
        skills: r.skills ?? [],
        areas: r.areas ?? [],
        availabilitySlots: r.availability_slots ?? [],
        status: r.status as 'pending' | 'approved' | 'rejected',
        createdAt: r.created_at,
      };
    });
  } catch (err) {
    console.error('Error fetching mentors:', err);
    return filterSampleMentors(skillFilter);
  }
}

function filterSampleMentors(skillFilter?: string): MentorProfile[] {
  if (!skillFilter || skillFilter === 'All') return SAMPLE_MENTORS;
  return SAMPLE_MENTORS.filter((m) =>
    m.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase())),
  );
}

export async function getMyMentorProfile(): Promise<MentorProfile | null> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const { data: row } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    name: currentUser.name,
    email: currentUser.email,
    bio: row.bio,
    skills: row.skills ?? [],
    areas: row.areas ?? [],
    availabilitySlots: row.availability_slots ?? [],
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdAt: row.created_at,
  };
}

export async function applyToBeMentor(data: {
  bio: string;
  skills: string[];
  areas: string[];
  availabilitySlots: string[];
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to apply.');

  const { data: existing } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('mentor_profiles')
      .update({
        bio: data.bio.trim(),
        skills: data.skills,
        areas: data.areas,
        availability_slots: data.availabilitySlots,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('mentor_profiles')
    .insert({
      user_id: currentUser.id,
      bio: data.bio.trim(),
      skills: data.skills,
      areas: data.areas,
      availability_slots: data.availabilitySlots,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to submit application: ${error.message}`);
  return inserted.id;
}

export async function approveMentorProfile(
  mentorId: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'organizer') throw new Error('Only admins can approve mentors.');

  const { error } = await supabase
    .from('mentor_profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', mentorId);

  if (error) throw new Error(`Failed to update mentor status: ${error.message}`);
}

export async function bookMentorshipSession(data: {
  mentorId: string;
  date: string;
  slot: string;
  topic: string;
  notes?: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to book a mentorship session.');

  // Database unique constraint: (mentor_id, date, slot)
  const { data: row, error } = await supabase
    .from('mentorship_sessions')
    .insert({
      mentor_id: data.mentorId,
      mentee_id: currentUser.id,
      date: data.date,
      slot: data.slot.trim(),
      topic: data.topic.trim(),
      notes: data.notes?.trim() || '',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505' || error.message.includes('unique')) {
      throw new Error('This slot is already booked for the selected date. Please pick another slot.');
    }
    throw new Error(`Failed to book session: ${error.message}`);
  }

  // Notify mentor of new booking
  try {
    const { data: mentorRecord } = await supabase
      .from('mentor_profiles')
      .select('user_id')
      .eq('id', data.mentorId)
      .maybeSingle();

    if (mentorRecord?.user_id) {
      await createNotification({
        userId: mentorRecord.user_id,
        actorId: currentUser.id,
        type: 'mentor_session',
        title: 'New mentorship session booked',
        message: `${currentUser.name || 'A student'} booked a session on ${data.date} (${data.slot})`,
        linkUrl: '/mentorship',
      });
    }
  } catch {
    // Non-fatal
  }

  return row.id;
}

export async function getMySessions(): Promise<{
  asMentee: MentorshipSession[];
  asMentor: MentorshipSession[];
}> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return { asMentee: [], asMentor: [] };

  // Sessions as mentee
  const { data: menteeRows } = await supabase
    .from('mentorship_sessions')
    .select('*')
    .eq('mentee_id', currentUser.id)
    .order('date', { ascending: true });

  // Check if current user is an approved mentor
  const { data: mentorProf } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  let mentorRows: typeof menteeRows = [];
  if (mentorProf) {
    const { data: mRows } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('mentor_id', mentorProf.id)
      .order('date', { ascending: true });
    mentorRows = mRows;
  }

  const allRows = [...(menteeRows ?? []), ...(mentorRows ?? [])];
  const mentorIds = [...new Set(allRows.map((r) => r.mentor_id))];
  const menteeIds = [...new Set(allRows.map((r) => r.mentee_id))];

  const { data: mentorProfiles } = mentorIds.length
    ? await supabase.from('mentor_profiles').select('id, user_id').in('id', mentorIds)
    : { data: [] };

  const mentorUserIds = (mentorProfiles ?? []).map((m) => m.user_id);
  const allUserIds = [...new Set([...menteeIds, ...mentorUserIds])];

  const { data: userProfiles } = allUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', allUserIds)
    : { data: [] };

  const userMap = new Map((userProfiles ?? []).map((u) => [u.id, u]));
  const mentorToUserMap = new Map((mentorProfiles ?? []).map((m) => [m.id, userMap.get(m.user_id)]));

  const formatSession = (r: (typeof allRows)[0]): MentorshipSession => {
    const mentorUser = mentorToUserMap.get(r.mentor_id);
    const menteeUser = userMap.get(r.mentee_id);
    return {
      id: r.id,
      mentorId: r.mentor_id,
      mentorName: mentorUser?.full_name || 'Mentor',
      mentorEmail: mentorUser?.email || '',
      menteeId: r.mentee_id,
      menteeName: menteeUser?.full_name || 'Mentee',
      menteeEmail: menteeUser?.email || '',
      slot: r.slot,
      date: r.date,
      topic: r.topic,
      notes: r.notes,
      status: r.status as MentorshipSession['status'],
      createdAt: r.created_at,
    };
  };

  return {
    asMentee: (menteeRows ?? []).map(formatSession),
    asMentor: (mentorRows ?? []).map(formatSession),
  };
}

export async function updateSessionStatus(
  sessionId: string,
  status: 'accepted' | 'declined' | 'completed' | 'cancelled',
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('mentorship_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

export async function getCodeReviews(): Promise<CodeReview[]> {
  if (!isSupabaseConfigured()) {
    return SAMPLE_REVIEWS;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from('code_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows || rows.length === 0) {
      return SAMPLE_REVIEWS;
    }

    const requesterIds = [...new Set(rows.map((r) => r.requester_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', requesterIds);

    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((r) => {
      const p = profMap.get(r.requester_id);
      return {
        id: r.id,
        requesterId: r.requester_id,
        requesterName: p?.full_name?.trim() || p?.email?.split('@')[0] || 'Student',
        requesterEmail: p?.email || '',
        title: r.title,
        githubUrl: r.github_url,
        codeSnippet: r.code_snippet,
        language: r.language,
        notes: r.notes,
        mentorId: r.mentor_id,
        mentorName: r.mentor_id ? 'Mentor' : null,
        feedback: r.feedback,
        status: r.status as CodeReview['status'],
        createdAt: r.created_at,
      };
    });
  } catch (err) {
    console.error('Error fetching code reviews:', err);
    return SAMPLE_REVIEWS;
  }
}

export async function requestCodeReview(data: {
  title: string;
  githubUrl?: string;
  codeSnippet?: string;
  language: string;
  notes: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to request a code review.');

  const { data: row, error } = await supabase
    .from('code_reviews')
    .insert({
      requester_id: currentUser.id,
      title: data.title.trim(),
      github_url: data.githubUrl?.trim() || null,
      code_snippet: data.codeSnippet?.trim() || null,
      language: data.language || 'Other',
      notes: data.notes.trim(),
      status: 'open',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to request code review: ${error.message}`);
  return row.id;
}

export async function claimCodeReview(reviewId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { data: mentorProf } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!mentorProf && currentUser.role !== 'organizer') {
    throw new Error('Only approved mentors can claim code reviews.');
  }

  const { error } = await supabase
    .from('code_reviews')
    .update({
      mentor_id: mentorProf?.id || null,
      status: 'claimed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) throw new Error(`Failed to claim review: ${error.message}`);
}

export async function submitReviewFeedback(reviewId: string, feedback: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('code_reviews')
    .update({
      feedback: feedback.trim(),
      status: 'reviewed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) throw new Error(`Failed to submit feedback: ${error.message}`);

  // Notify review requester
  try {
    const { data: rev } = await supabase
      .from('code_reviews')
      .select('requester_id, title')
      .eq('id', reviewId)
      .maybeSingle();

    if (rev?.requester_id && rev.requester_id !== currentUser.id) {
      await createNotification({
        userId: rev.requester_id,
        actorId: currentUser.id,
        type: 'code_review',
        title: 'Feedback submitted on your code review',
        message: `${currentUser.name || 'A mentor'} completed your review: "${rev.title}"`,
        linkUrl: '/mentorship',
      });
    }
  } catch {
    // Non-fatal
  }
}

export async function resolveCodeReview(reviewId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('code_reviews')
    .update({
      status: 'resolved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) throw new Error(`Failed to resolve review: ${error.message}`);
}
