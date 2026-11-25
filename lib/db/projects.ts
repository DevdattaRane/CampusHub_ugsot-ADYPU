import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { checkUserPostingEligibility } from './moderation';
import { createNotification } from './notifications';
import type { CollaborationRequest, GitHubRepoStats, Project, ProjectComment } from '@/lib/types';
import type { Database } from '@/lib/db/database.types';

// Built-in starter seed projects
const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'sample-proj-1',
    title: 'CampusPulse IoT Energy Grid',
    shortDescription: 'Smart campus power monitoring using ESP32 nodes and Next.js live telemetry dashboard.',
    description: 'CampusPulse was built for the UGSOT Smart Campus Ideathon. It tracks real-time classroom power draw, identifies idle consumption across Block A and B, and notifies campus facilities when anomalies are detected.',
    techStack: ['React', 'Next.js', 'PostgreSQL', 'Python', 'IoT'],
    githubUrl: 'https://github.com/campus-hub/campuspulse-iot',
    demoUrl: 'https://campus-hub-demo.vercel.app',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    lookingForCollaborators: true,
    rolesNeeded: ['Embedded Systems Dev', 'Data Analyst'],
    ownerId: 'student-seed-1',
    ownerName: 'Aarav Patil',
    ownerEmail: 'student@adypu.edu.in',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    likesCount: 18,
    commentsCount: 3,
    hasLiked: false,
    hasBookmarked: false,
    canEdit: false,
  },
  {
    id: 'sample-proj-2',
    title: 'CodeSync Collaborative Whiteboard',
    shortDescription: 'Peer-to-peer visual workspace for students preparing for DSA and system design interviews.',
    description: 'Real-time collaborative canvas with executable JavaScript and Python scratchpads. Built to help UGSOT students practice data structures and algorithms together in study pods.',
    techStack: ['TypeScript', 'Canvas', 'WebSockets', 'Node.js'],
    githubUrl: 'https://github.com/campus-hub/codesync-whiteboard',
    demoUrl: 'https://codesync.dev',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    lookingForCollaborators: true,
    rolesNeeded: ['UI/UX Designer', 'Backend Go dev'],
    ownerId: 'sneha-user-id',
    ownerName: 'Sneha Kulkarni',
    ownerEmail: 'sneha@adypu.edu.in',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    likesCount: 24,
    commentsCount: 5,
    hasLiked: false,
    hasBookmarked: false,
    canEdit: false,
  },
  {
    id: 'sample-proj-3',
    title: 'AutoGrader CLI for C++ Labs',
    shortDescription: 'Local terminal tool that runs automated test suites against student C++ assignments.',
    description: 'An open-source CLI that compiles and tests student code against professor testcases in an isolated sandbox, giving instantaneous feedback on memory leaks and edge-cases before final submission.',
    techStack: ['C/C++', 'Linux', 'Docker', 'Bash'],
    githubUrl: 'https://github.com/campus-hub/autograder-cli',
    demoUrl: null,
    imageUrl: null,
    lookingForCollaborators: false,
    rolesNeeded: [],
    ownerId: 'rohan-user-id',
    ownerName: 'Rohan Deshmukh',
    ownerEmail: 'rohan@adypu.edu.in',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    likesCount: 15,
    commentsCount: 2,
    hasLiked: false,
    hasBookmarked: false,
    canEdit: false,
  },
];

// Simple in-memory cache for GitHub statistics (5 minute TTL)
const gitHubCache = new Map<string, { stats: GitHubRepoStats | null; expiry: number }>();

export async function fetchGitHubRepoStats(repoUrl?: string | null): Promise<GitHubRepoStats | null> {
  if (!repoUrl) return null;

  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const key = `${owner}/${repo}`.toLowerCase();

    const cached = gitHubCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.stats;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CampusHub-UGSOT',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      gitHubCache.set(key, { stats: null, expiry: Date.now() + 60000 });
      return null;
    }

    const data = await res.json();
    const stats: GitHubRepoStats = {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      language: data.language ?? 'Unknown',
      updatedAt: data.updated_at ?? new Date().toISOString(),
    };

    gitHubCache.set(key, { stats, expiry: Date.now() + 300000 });
    return stats;
  } catch {
    return null;
  }
}

export async function getProjects(options?: {
  tech?: string;
  lookingForCollaborators?: boolean;
  search?: string;
}): Promise<Project[]> {
  if (!isSupabaseConfigured()) {
    return filterSampleProjects(SAMPLE_PROJECTS, options);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();

    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (options?.lookingForCollaborators) {
      query = query.eq('looking_for_collaborators', true);
    }
    if (options?.tech && options.tech !== 'All') {
      query = query.contains('tech_stack', [options.tech]);
    }

    const { data: projects, error } = await query;
    if (error || !projects || projects.length === 0) {
      return filterSampleProjects(SAMPLE_PROJECTS, options);
    }

    const ownerIds = [...new Set(projects.map((p) => p.owner_id))];
    const projectIds = projects.map((p) => p.id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ownerIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Fetch likes
    const { data: likes } = await supabase
      .from('project_likes')
      .select('project_id, user_id')
      .in('project_id', projectIds);

    const likesCountMap = new Map<string, number>();
    const userLikedSet = new Set<string>();

    for (const like of likes ?? []) {
      likesCountMap.set(like.project_id, (likesCountMap.get(like.project_id) ?? 0) + 1);
      if (currentUser && like.user_id === currentUser.id) {
        userLikedSet.add(like.project_id);
      }
    }

    // Fetch bookmarks
    const userBookmarkedSet = new Set<string>();
    if (currentUser) {
      const { data: bookmarks } = await supabase
        .from('project_bookmarks')
        .select('project_id')
        .eq('user_id', currentUser.id)
        .in('project_id', projectIds);

      for (const b of bookmarks ?? []) {
        userBookmarkedSet.add(b.project_id);
      }
    }

    // Fetch comments count
    const { data: comments } = await supabase
      .from('project_comments')
      .select('project_id')
      .in('project_id', projectIds);

    const commentCountMap = new Map<string, number>();
    for (const c of comments ?? []) {
      commentCountMap.set(c.project_id, (commentCountMap.get(c.project_id) ?? 0) + 1);
    }

    const isOrganizer = currentUser?.role === 'organizer';

    let result: Project[] = projects.map((p) => {
      const prof = profileMap.get(p.owner_id);
      return {
        id: p.id,
        title: p.title,
        shortDescription: p.short_description,
        description: p.description,
        techStack: p.tech_stack ?? [],
        githubUrl: p.github_url,
        demoUrl: p.demo_url,
        imageUrl: p.image_url,
        lookingForCollaborators: Boolean(p.looking_for_collaborators),
        rolesNeeded: p.roles_needed ?? [],
        ownerId: p.owner_id,
        ownerName: prof?.full_name?.trim() || prof?.email?.split('@')[0] || 'Student',
        ownerEmail: prof?.email || '',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        likesCount: likesCountMap.get(p.id) ?? 0,
        commentsCount: commentCountMap.get(p.id) ?? 0,
        hasLiked: userLikedSet.has(p.id),
        hasBookmarked: userBookmarkedSet.has(p.id),
        canEdit: Boolean(currentUser && (currentUser.id === p.owner_id || isOrganizer)),
      };
    });

    if (options?.search && options.search.trim()) {
      const term = options.search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.shortDescription.toLowerCase().includes(term) ||
          p.techStack.some((t) => t.toLowerCase().includes(term)),
      );
    }

    return result;
  } catch (err) {
    console.error('Error in getProjects:', err);
    return filterSampleProjects(SAMPLE_PROJECTS, options);
  }
}

function filterSampleProjects(
  projects: Project[],
  options?: { tech?: string; lookingForCollaborators?: boolean; search?: string },
): Project[] {
  let list = [...projects];
  if (options?.lookingForCollaborators) {
    list = list.filter((p) => p.lookingForCollaborators);
  }
  if (options?.tech && options.tech !== 'All') {
    list = list.filter((p) => p.techStack.includes(options.tech!));
  }
  if (options?.search && options.search.trim()) {
    const term = options.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.shortDescription.toLowerCase().includes(term) ||
        p.techStack.some((t) => t.toLowerCase().includes(term)),
    );
  }
  return list;
}

export async function getProjectById(
  id: string,
): Promise<{
  project: Project;
  comments: ProjectComment[];
  collaborationRequests?: CollaborationRequest[];
  githubStats?: GitHubRepoStats | null;
} | null> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  const isOrganizer = currentUser?.role === 'organizer';

  const { data: row, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();

  if (error || !row) {
    const sample = SAMPLE_PROJECTS.find((p) => p.id === id);
    if (!sample) return null;
    const githubStats = await fetchGitHubRepoStats(sample.githubUrl);
    return {
      project: sample,
      comments: [
        {
          id: 'sample-comm-1',
          projectId: id,
          userId: 'expert-1',
          userName: 'Isha Joshi',
          userEmail: 'isha@adypu.edu.in',
          content: 'This looks super clean! Are you presenting this in the upcoming Ideathon?',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          canDelete: false,
        },
      ],
      githubStats,
    };
  }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', row.owner_id)
    .maybeSingle();

  const { data: likes } = await supabase.from('project_likes').select('user_id').eq('project_id', id);

  const { data: bookmarks } = currentUser
    ? await supabase
        .from('project_bookmarks')
        .select('user_id')
        .eq('project_id', id)
        .eq('user_id', currentUser.id)
    : { data: [] };

  const isOwner = Boolean(currentUser && currentUser.id === row.owner_id);

  const { data: commentRows } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  const commentUserIds = [...new Set((commentRows ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } = commentUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', commentUserIds)
    : { data: [] };

  const commentProfMap = new Map((commentProfiles ?? []).map((p) => [p.id, p]));

  const comments: ProjectComment[] = (commentRows ?? []).map((c) => {
    const p = commentProfMap.get(c.user_id);
    return {
      id: c.id,
      projectId: c.project_id,
      userId: c.user_id,
      userName: p?.full_name?.trim() || p?.email?.split('@')[0] || 'Student',
      userEmail: p?.email || '',
      content: c.content,
      createdAt: c.created_at,
      canDelete: Boolean(currentUser && (currentUser.id === c.user_id || isOwner || isOrganizer)),
    };
  });

  // Collaboration requests (visible only to project owner)
  let collaborationRequests: CollaborationRequest[] = [];
  if (isOwner) {
    const { data: requests } = await supabase
      .from('project_collaborations')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    const senderIds = [...new Set((requests ?? []).map((r) => r.sender_id))];
    const { data: senderProfiles } = senderIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', senderIds)
      : { data: [] };

    const senderMap = new Map((senderProfiles ?? []).map((p) => [p.id, p]));

    collaborationRequests = (requests ?? []).map((r) => {
      const s = senderMap.get(r.sender_id);
      return {
        id: r.id,
        projectId: r.project_id,
        projectTitle: row.title,
        senderId: r.sender_id,
        senderName: s?.full_name?.trim() || s?.email?.split('@')[0] || 'Student',
        senderEmail: s?.email || '',
        message: r.message,
        roleInterested: r.role_interested,
        status: r.status as 'pending' | 'accepted' | 'declined',
        createdAt: r.created_at,
      };
    });
  }

  const githubStats = await fetchGitHubRepoStats(row.github_url);

  const project: Project = {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    techStack: row.tech_stack ?? [],
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    imageUrl: row.image_url,
    lookingForCollaborators: Boolean(row.looking_for_collaborators),
    rolesNeeded: row.roles_needed ?? [],
    ownerId: row.owner_id,
    ownerName: ownerProfile?.full_name?.trim() || ownerProfile?.email?.split('@')[0] || 'Student',
    ownerEmail: ownerProfile?.email || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likesCount: (likes ?? []).length,
    commentsCount: comments.length,
    hasLiked: Boolean(currentUser && (likes ?? []).some((l) => l.user_id === currentUser.id)),
    hasBookmarked: Boolean((bookmarks ?? []).length > 0),
    canEdit: Boolean(isOwner || isOrganizer),
  };

  return { project, comments, collaborationRequests, githubStats };
}

export async function createProject(data: {
  title: string;
  shortDescription: string;
  description: string;
  techStack: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  imageUrl?: string | null;
  lookingForCollaborators: boolean;
  rolesNeeded: string[];
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to post a project.');

  // Rate-limit, spam cooldown, and suspension check
  const eligibility = await checkUserPostingEligibility(currentUser.id, data.description);
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason || 'You are not eligible to upload a project right now.');
  }

  const { data: row, error } = await supabase
    .from('projects')
    .insert({
      title: data.title.trim(),
      short_description: data.shortDescription.trim(),
      description: data.description.trim(),
      tech_stack: data.techStack,
      github_url: data.githubUrl?.trim() || null,
      demo_url: data.demoUrl?.trim() || null,
      image_url: data.imageUrl?.trim() || null,
      looking_for_collaborators: data.lookingForCollaborators,
      roles_needed: data.rolesNeeded,
      owner_id: currentUser.id,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return row.id;
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    shortDescription: string;
    description: string;
    techStack: string[];
    githubUrl: string | null;
    demoUrl: string | null;
    imageUrl: string | null;
    lookingForCollaborators: boolean;
    rolesNeeded: string[];
  }>,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const updates: Database['public']['Tables']['projects']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.shortDescription !== undefined) updates.short_description = data.shortDescription.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.techStack !== undefined) updates.tech_stack = data.techStack;
  if (data.githubUrl !== undefined) updates.github_url = data.githubUrl?.trim() || null;
  if (data.demoUrl !== undefined) updates.demo_url = data.demoUrl?.trim() || null;
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl?.trim() || null;
  if (data.lookingForCollaborators !== undefined)
    updates.looking_for_collaborators = data.lookingForCollaborators;
  if (data.rolesNeeded !== undefined) updates.roles_needed = data.rolesNeeded;

  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update project: ${error.message}`);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

export async function toggleProjectLike(projectId: string): Promise<{ liked: boolean; count: number }> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to like projects.');

  const { data: existing } = await supabase
    .from('project_likes')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('project_likes').delete().eq('project_id', projectId).eq('user_id', currentUser.id);
  } else {
    await supabase.from('project_likes').insert({ project_id: projectId, user_id: currentUser.id });

    // Notify project owner of like
    try {
      const { data: proj } = await supabase
        .from('projects')
        .select('id, title, owner_id')
        .eq('id', projectId)
        .maybeSingle();

      if (proj && proj.owner_id && proj.owner_id !== currentUser.id) {
        await createNotification({
          userId: proj.owner_id,
          actorId: currentUser.id,
          type: 'project_like',
          title: 'Someone liked your project',
          message: `${currentUser.name || 'A student'} liked "${proj.title}"`,
          linkUrl: `/projects/${proj.id}`,
        });
      }
    } catch {
      // Non-fatal
    }
  }

  const { data: total } = await supabase.from('project_likes').select('user_id').eq('project_id', projectId);
  return { liked: !existing, count: total?.length ?? 0 };
}

export async function toggleProjectBookmark(projectId: string): Promise<{ bookmarked: boolean }> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to bookmark projects.');

  const { data: existing } = await supabase
    .from('project_bookmarks')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('project_bookmarks')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', currentUser.id);
  } else {
    await supabase.from('project_bookmarks').insert({ project_id: projectId, user_id: currentUser.id });
  }

  return { bookmarked: !existing };
}

export async function getMyBookmarkedProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const { data: bookmarkRows } = await supabase
    .from('project_bookmarks')
    .select('project_id')
    .eq('user_id', currentUser.id);

  const ids = (bookmarkRows ?? []).map((b) => b.project_id);
  if (ids.length === 0) return [];

  const { data: projects } = await supabase.from('projects').select('*').in('id', ids);
  if (!projects || projects.length === 0) return [];

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    shortDescription: p.short_description,
    description: p.description,
    techStack: p.tech_stack ?? [],
    githubUrl: p.github_url,
    demoUrl: p.demo_url,
    imageUrl: p.image_url,
    lookingForCollaborators: Boolean(p.looking_for_collaborators),
    rolesNeeded: p.roles_needed ?? [],
    ownerId: p.owner_id,
    ownerName: 'Project Owner',
    ownerEmail: '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    likesCount: 0,
    commentsCount: 0,
    hasLiked: false,
    hasBookmarked: true,
    canEdit: false,
  }));
}

export async function addProjectComment(projectId: string, content: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to comment.');

  // Rate-limit, spam cooldown, and suspension check
  const eligibility = await checkUserPostingEligibility(currentUser.id, content);
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason || 'You are not eligible to comment right now.');
  }

  const { data, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      user_id: currentUser.id,
      content: content.trim(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to post comment: ${error.message}`);

  // Notify project owner of new comment
  try {
    const { data: proj } = await supabase
      .from('projects')
      .select('id, title, owner_id')
      .eq('id', projectId)
      .maybeSingle();

    if (proj && proj.owner_id && proj.owner_id !== currentUser.id) {
      await createNotification({
        userId: proj.owner_id,
        actorId: currentUser.id,
        type: 'project_comment',
        title: 'New comment on your project',
        message: `${currentUser.name || 'A student'} commented on "${proj.title}"`,
        linkUrl: `/projects/${proj.id}#comments`,
      });
    }
  } catch {
    // Non-fatal
  }

  return data.id;
}

export async function deleteProjectComment(commentId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase.from('project_comments').delete().eq('id', commentId);
  if (error) throw new Error(`Failed to delete comment: ${error.message}`);
}

export async function sendCollaborationRequest(
  projectId: string,
  message: string,
  roleInterested: string,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to send a collaboration request.');

  const { data, error } = await supabase
    .from('project_collaborations')
    .insert({
      project_id: projectId,
      sender_id: currentUser.id,
      message: message.trim(),
      role_interested: roleInterested.trim(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to send request: ${error.message}`);

  // Notify project owner
  try {
    const { data: proj } = await supabase
      .from('projects')
      .select('id, title, owner_id')
      .eq('id', projectId)
      .maybeSingle();

    if (proj && proj.owner_id && proj.owner_id !== currentUser.id) {
      await createNotification({
        userId: proj.owner_id,
        actorId: currentUser.id,
        type: 'collaboration_request',
        title: 'New collaboration request',
        message: `${currentUser.name || 'A student'} wants to join "${proj.title}" as ${roleInterested}`,
        linkUrl: `/projects/${proj.id}`,
      });
    }
  } catch {
    // Non-fatal
  }

  return data.id;
}

export async function updateCollaborationStatus(
  requestId: string,
  status: 'accepted' | 'declined',
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('project_collaborations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to update request: ${error.message}`);
}
