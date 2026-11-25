import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { events } from '@/lib/data';
import type { Opportunity, OpportunityCategory } from '@/lib/types';
import type { Database } from './database.types';

type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];

// Fallback seed data in case Supabase table has not yet been populated
const FALLBACK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'sample-opp-1',
    title: '[SAMPLE] Google Summer of Code (GSoC) 2027 Open Source Mentorship',
    organization: 'Google Open Source Programs Office',
    category: 'Open-source programs',
    description:
      'Work with open-source organizations on a 12+ week programming project under the guidance of dedicated mentors. Stipend provided based on location.',
    link: 'https://summerofcode.withgoogle.com',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    location: 'Remote',
    eligibility: 'Enrolled university students or open-source contributors aged 18+',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-opp-2',
    title: '[SAMPLE] ADYPU Innovation Lab Winter Software Intern',
    organization: 'ADYPU Center for Innovation & Research',
    category: 'Internships',
    description:
      'Join our student-led engineering team to build smart-campus IoT dashboards, web platforms, and automated attendance solutions. 3 months part-time.',
    link: 'https://adypu.edu.in',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: 'Pune Campus (Hybrid)',
    eligibility: '2nd & 3rd Year B.Tech CSE / IT / AI-DS with React & Node experience',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-opp-3',
    title: '[SAMPLE] MLH Global Fellowship - Open Source Software Track',
    organization: 'Major League Hacking (MLH)',
    category: 'Fellowships',
    description:
      'A 12-week remote internship alternative where fellows contribute directly to production open-source repositories used by millions.',
    link: 'https://fellowship.mlh.io',
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    location: 'Remote',
    eligibility: 'All degree programs, demonstrable Git & programming fundamentals',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Maps hackathons from events catalog into Opportunity format
 * so hackathons stay single-sourced from events!
 */
function getHackathonOpportunities(): Opportunity[] {
  return events
    .filter((e) => e.type === 'hackathon')
    .map((e) => {
      const hackathon = e.type === 'hackathon' ? e : null;
      return {
        id: `event-${e.id}`,
        title: e.title,
        organization: 'CampusHub Dev Club',
        category: 'Hackathons' as OpportunityCategory,
        description: hackathon
          ? `Official Campus Hackathon. Theme: ${hackathon.theme}. Team Size: ${hackathon.teamSizeMin}-${hackathon.teamSizeMax} members. Prize Pool: ${hackathon.prize}. Mode: ${e.mode} (${e.where}).`
          : `Official Campus Hackathon. Mode: ${e.mode} (${e.where}).`,
        link: `/events/${e.id}`,
        deadline: new Date(`${e.registrationDeadline}T23:59:59Z`).toISOString(),
        location: e.place,
        eligibility: 'All ADYPU & partner college students',
        isFromEvents: true,
        eventUrl: `/events/${e.id}`,
        createdAt: '2026-10-01T00:00:00Z',
      };
    });
}

function computeClosingSoon(deadlineIso: string): boolean {
  const deadlineTime = new Date(deadlineIso).getTime();
  const nowTime = Date.now();
  const diff = deadlineTime - nowTime;
  // Closing soon if deadline is in the future but within 7 days
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export async function getOpportunities(options?: {
  category?: string;
  search?: string;
  hideExpired?: boolean;
}): Promise<Opportunity[]> {
  const currentUser = await getCurrentUser();
  let dbOpportunities: Opportunity[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: rows, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('deadline', { ascending: true });

      if (error || !rows || rows.length === 0) {
        dbOpportunities = FALLBACK_OPPORTUNITIES;
      } else {
        dbOpportunities = rows.map((r: OpportunityRow) => ({
          id: r.id,
          title: r.title,
          organization: r.organization,
          category: r.category as OpportunityCategory,
          description: r.description,
          link: r.link,
          deadline: r.deadline,
          location: r.location,
          eligibility: r.eligibility,
          creatorId: r.creator_id,
          createdAt: r.created_at,
        }));
      }
    } catch (err) {
      console.error('Error fetching opportunities from DB:', err);
      dbOpportunities = FALLBACK_OPPORTUNITIES;
    }
  } else {
    dbOpportunities = FALLBACK_OPPORTUNITIES;
  }

  // Pull hackathons from events (Single Source of Truth)
  const hackathons = getHackathonOpportunities();

  // Combine and deduplicate
  let all = [...dbOpportunities, ...hackathons];

  // Fetch bookmarks for signed-in user
  if (currentUser && isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: bookmarks } = await supabase
        .from('opportunity_bookmarks')
        .select('opportunity_id')
        .eq('user_id', currentUser.id);

      const bookmarkedSet = new Set((bookmarks ?? []).map((b) => b.opportunity_id));
      all = all.map((opp) => ({
        ...opp,
        isBookmarked: bookmarkedSet.has(opp.id),
      }));
    } catch {
      // Gracefully continue
    }
  }

  // Calculate closing soon
  all = all.map((opp) => ({
    ...opp,
    isClosingSoon: computeClosingSoon(opp.deadline),
  }));

  // Filtering
  if (options?.category && options.category !== 'All') {
    all = all.filter((opp) => opp.category.toLowerCase() === options.category?.toLowerCase());
  }

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    all = all.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.organization.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q),
    );
  }

  if (options?.hideExpired) {
    const now = Date.now();
    all = all.filter((opp) => new Date(opp.deadline).getTime() >= now);
  }

  // Sort by deadline ascending (soonest deadline first)
  all.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return all;
}

export async function createOpportunity(data: {
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string;
  link: string;
  deadline: string;
  location: string;
  eligibility: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== 'organizer') {
    throw new Error('Only organizers and administrators can post opportunities.');
  }

  const { data: row, error } = await supabase
    .from('opportunities')
    .insert({
      creator_id: currentUser.id,
      title: data.title.trim(),
      organization: data.organization.trim(),
      category: data.category,
      description: data.description.trim(),
      link: data.link.trim(),
      deadline: data.deadline,
      location: data.location.trim() || 'Remote',
      eligibility: data.eligibility.trim() || 'All students',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create opportunity: ${error.message}`);
  return row.id;
}

export async function updateOpportunity(
  id: string,
  data: Partial<{
    title: string;
    organization: string;
    category: OpportunityCategory;
    description: string;
    link: string;
    deadline: string;
    location: string;
    eligibility: string;
  }>,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== 'organizer') {
    throw new Error('Only organizers and administrators can edit opportunities.');
  }

  const { error } = await supabase
    .from('opportunities')
    .update({
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.organization ? { organization: data.organization.trim() } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.description ? { description: data.description.trim() } : {}),
      ...(data.link ? { link: data.link.trim() } : {}),
      ...(data.deadline ? { deadline: data.deadline } : {}),
      ...(data.location ? { location: data.location.trim() } : {}),
      ...(data.eligibility ? { eligibility: data.eligibility.trim() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to update opportunity: ${error.message}`);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== 'organizer') {
    throw new Error('Only organizers and administrators can delete opportunities.');
  }

  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete opportunity: ${error.message}`);
}

export async function toggleOpportunityBookmark(
  opportunityId: string,
): Promise<{ isBookmarked: boolean }> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to bookmark opportunities.');

  const { data: existing } = await supabase
    .from('opportunity_bookmarks')
    .select('created_at')
    .eq('user_id', currentUser.id)
    .eq('opportunity_id', opportunityId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('opportunity_bookmarks')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('opportunity_id', opportunityId);
    return { isBookmarked: false };
  } else {
    await supabase
      .from('opportunity_bookmarks')
      .insert({ user_id: currentUser.id, opportunity_id: opportunityId });
    return { isBookmarked: true };
  }
}

export async function getMyBookmarkedOpportunities(): Promise<Opportunity[]> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const { data: bookmarks } = await supabase
    .from('opportunity_bookmarks')
    .select('opportunity_id')
    .eq('user_id', currentUser.id);

  if (!bookmarks || bookmarks.length === 0) return [];
  const ids = bookmarks.map((b) => b.opportunity_id);

  const { data: rows } = await supabase
    .from('opportunities')
    .select('*')
    .in('id', ids);

  if (!rows) return [];

  return rows.map((r: OpportunityRow) => ({
    id: r.id,
    title: r.title,
    organization: r.organization,
    category: r.category as OpportunityCategory,
    description: r.description,
    link: r.link,
    deadline: r.deadline,
    location: r.location,
    eligibility: r.eligibility,
    creatorId: r.creator_id,
    isBookmarked: true,
    isClosingSoon: computeClosingSoon(r.deadline),
    createdAt: r.created_at,
  }));
}
