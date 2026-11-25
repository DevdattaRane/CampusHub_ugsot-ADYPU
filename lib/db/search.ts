import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { events as localEvents, students as localStudents } from '@/lib/data';
import type { GlobalSearchResults } from '@/lib/types';

/**
 * Global multi-entity search across CampusHub.
 * Respects student privacy flags (is_profile_private, is_hidden_from_leaderboard).
 */
export async function performGlobalSearch(rawQuery: string): Promise<GlobalSearchResults> {
  const query = rawQuery.trim().toLowerCase();
  const emptyResult: GlobalSearchResults = {
    query: rawQuery,
    totalCount: 0,
    events: [],
    projects: [],
    forum: [],
    opportunities: [],
    students: [],
  };

  if (query.length < 2) return emptyResult;

  // Search local events first
  const matchedEvents = localEvents
    .filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.place.toLowerCase().includes(query) ||
        ('theme' in e && e.theme?.toLowerCase().includes(query))
    )
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      start: e.start,
      where: e.where,
    }));

  if (!isSupabaseConfigured()) {
    // Fallback to local students if Supabase is unconfigured
    const matchedStudents = localStudents
      .filter((s) => s.name.toLowerCase().includes(query) || s.skills.some((sk) => sk.toLowerCase().includes(query)))
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        courseYear: s.year,
        skills: s.skills,
      }));

    return {
      query: rawQuery,
      totalCount: matchedEvents.length + matchedStudents.length,
      events: matchedEvents,
      projects: [],
      forum: [],
      opportunities: [],
      students: matchedStudents,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Projects search
    const { data: dbProjects } = await supabase
      .from('projects')
      .select('id, title, short_description, tech_stack')
      .eq('is_hidden', false)
      .or(`title.ilike.%${query}%,short_description.ilike.%${query}%`)
      .limit(6);

    // 2. Community posts search
    const { data: dbPosts } = await supabase
      .from('forum_posts')
      .select('id, title, content, type, tags')
      .eq('is_hidden', false)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(6);

    // 3. Opportunities search
    const { data: dbOpps } = await supabase
      .from('opportunities')
      .select('id, title, organization, category, location')
      .or(`title.ilike.%${query}%,organization.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(6);

    // 4. Students search (respecting privacy flags: is_profile_private = false)
    const { data: dbStudents } = await supabase
      .from('profiles')
      .select('id, full_name, course_year, skills')
      .eq('is_profile_private', false)
      .ilike('full_name', `%${query}%`)
      .limit(6);

    const projects = (dbProjects || []).map((p) => ({
      id: p.id,
      title: p.title,
      shortDescription: p.short_description,
      techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    }));

    const forum = (dbPosts || []).map((p) => ({
      id: p.id,
      title: p.title,
      bodySnippet: (p.content || '').slice(0, 100),
      type: p.type,
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));

    const opportunities = (dbOpps || []).map((o) => ({
      id: o.id,
      title: o.title,
      organization: o.organization,
      category: o.category,
      location: o.location,
    }));

    const students = (dbStudents || []).map((s) => ({
      id: s.id,
      name: s.full_name || 'Anonymous Student',
      courseYear: s.course_year,
      skills: Array.isArray(s.skills) ? s.skills : [],
    }));

    const totalCount =
      matchedEvents.length +
      projects.length +
      forum.length +
      opportunities.length +
      students.length;

    return {
      query: rawQuery,
      totalCount,
      events: matchedEvents,
      projects,
      forum,
      opportunities,
      students,
    };
  } catch {
    return {
      query: rawQuery,
      totalCount: matchedEvents.length,
      events: matchedEvents,
      projects: [],
      forum: [],
      opportunities: [],
      students: [],
    };
  }
}
