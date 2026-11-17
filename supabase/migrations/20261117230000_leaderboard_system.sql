-- Migration: 20261117230000_leaderboard_system.sql
-- Step 1 & 2: Leaderboard, Point Rules, Anti-Farming Logic, and User Ranks

-- 1. Add moderation flag to profiles
alter table public.profiles
  add column if not exists is_hidden_from_leaderboard boolean not null default false;

-- 2. Update role & moderation guard on profiles
create or replace function public.prevent_self_role_change()
returns trigger as $$
begin
  -- Prevent role alteration by non-organizers
  if (NEW.role is distinct from OLD.role) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Users cannot change their own or other roles.';
    end if;
  end if;

  -- Prevent leaderboard moderation alteration by non-organizers
  if (NEW.is_hidden_from_leaderboard is distinct from OLD.is_hidden_from_leaderboard) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Only organizers can hide or unhide users from the leaderboard.';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Point Rules Reference Table
create table if not exists public.point_rules (
  action_key text primary key,
  points integer not null check (points >= 0),
  category text not null check (category in ('events', 'projects', 'forum', 'mentorship')),
  description text not null
);

insert into public.point_rules (action_key, points, category, description)
values
  ('event_registered', 2, 'events', 'Registered for a campus event'),
  ('event_attended', 10, 'events', 'Attended an event (marked present)'),
  ('certificate_earned', 5, 'events', 'Official event completion certificate earned'),
  ('hackathon_team', 8, 'events', 'Created or joined a hackathon team'),
  ('project_posted', 15, 'projects', 'Published a student project in the showcase'),
  ('project_like_received', 1, 'projects', 'Like received on your project (max 20 per project, no self-likes)'),
  ('project_comment_received', 1, 'projects', 'Comment received on your project (max 20 per project, no self-comments)'),
  ('forum_question_posted', 2, 'forum', 'Posted a technical question in the community forum'),
  ('forum_answer_posted', 5, 'forum', 'Posted an answer or response to a question'),
  ('forum_answer_accepted', 15, 'forum', 'Answer verified and accepted by question author (no self-accepts)'),
  ('forum_upvote_received', 1, 'forum', 'Upvote received on a forum post or answer (max 20 per item, no self-upvotes)'),
  ('mentorship_mentor_completed', 10, 'mentorship', 'Completed a 1:1 mentorship session as a mentor'),
  ('mentorship_mentee_completed', 3, 'mentorship', 'Completed a 1:1 mentorship session as a mentee'),
  ('code_review_completed', 8, 'mentorship', 'Provided constructive review on submitted code')
on conflict (action_key) do update
set points = excluded.points,
    category = excluded.category,
    description = excluded.description;

-- Grant read on point_rules
alter table public.point_rules enable row level security;
create policy "Anyone can read point rules"
  on public.point_rules for select using (true);

-- 4. Main Leaderboard Function
create or replace function public.get_leaderboard(
  p_time_filter text default 'all',
  p_category_filter text default 'overall',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  course_year text,
  github_username text,
  events_points bigint,
  projects_points bigint,
  forum_points bigint,
  mentorship_points bigint,
  total_points bigint,
  score bigint,
  rank bigint,
  badges text[],
  first_activity_at timestamptz
)
language plpgsql
stable
security definer
as $$
declare
  t_start timestamptz;
  v_category text;
begin
  -- Resolve time filter
  if p_time_filter = 'month' then
    t_start := date_trunc('month', now());
  elsif p_time_filter = 'week' then
    t_start := date_trunc('week', now());
  else
    t_start := '1970-01-01'::timestamptz;
  end if;

  v_category := lower(trim(coalesce(p_category_filter, 'overall')));

  return query
  with user_activities as (
    select
      p.id as u_id,
      p.full_name as u_name,
      p.email as u_email,
      p.course_year as u_year,
      p.github_username as u_github,
      p.created_at as u_created_at,

      -- 1. Events Points
      (
        -- Registered: 2 pts
        coalesce((select count(*) * 2 from public.event_registrations er where er.user_id = p.id and er.registered_at >= t_start), 0) +
        -- Attended: 10 pts
        coalesce((select count(*) * 10 from public.event_attendance ea where ea.user_id = p.id and ea.status = 'present' and ea.marked_at >= t_start), 0) +
        -- Certificate: 5 pts
        coalesce((select count(*) * 5 from public.event_certificates ec where ec.user_id = p.id and ec.issued_at >= t_start), 0) +
        -- Hackathon team created: 8 pts
        coalesce((select count(*) * 8 from public.event_teams et where et.leader_id = p.id and et.created_at >= t_start), 0) +
        -- Hackathon team member: 8 pts
        coalesce((select count(*) * 8 from public.event_team_members etm where etm.email_key = lower(trim(p.email)) and etm.created_at >= t_start), 0)
      )::bigint as pts_events,

      -- 2. Projects Points
      (
        -- Project posted: 15 pts
        coalesce((select count(*) * 15 from public.projects pr where pr.owner_id = p.id and pr.created_at >= t_start), 0) +
        -- Likes received (non-self, max 20 per project): 1 pt
        coalesce((
          select sum(least(20, lk_cnt)) * 1
          from (
            select count(pl.user_id) as lk_cnt
            from public.projects pr
            join public.project_likes pl on pl.project_id = pr.id
            where pr.owner_id = p.id and pl.user_id != pr.owner_id and pl.created_at >= t_start
            group by pr.id
          ) s1
        ), 0) +
        -- Comments received (non-self, max 20 per project): 1 pt
        coalesce((
          select sum(least(20, cm_cnt)) * 1
          from (
            select count(pc.id) as cm_cnt
            from public.projects pr
            join public.project_comments pc on pc.project_id = pr.id
            where pr.owner_id = p.id and pc.author_id != pr.owner_id and pc.created_at >= t_start
            group by pr.id
          ) s2
        ), 0)
      )::bigint as pts_projects,

      -- 3. Forum Points
      (
        -- Question posted: 2 pts
        coalesce((select count(*) * 2 from public.forum_posts fp where fp.author_id = p.id and fp.type = 'question' and fp.created_at >= t_start), 0) +
        -- Answer posted: 5 pts
        coalesce((select count(*) * 5 from public.forum_answers fa where fa.author_id = p.id and fa.created_at >= t_start), 0) +
        -- Answer accepted (non-self): 15 pts
        coalesce((
          select count(*) * 15
          from public.forum_answers fa
          join public.forum_posts fp on fp.accepted_answer_id = fa.id
          where fa.author_id = p.id and fp.author_id != fa.author_id and fa.created_at >= t_start
        ), 0) +
        -- Post upvotes received (non-self, max 20 per post): 1 pt
        coalesce((
          select sum(least(20, uv_cnt)) * 1
          from (
            select count(fu.user_id) as uv_cnt
            from public.forum_posts fp
            join public.forum_upvotes fu on fu.item_id = fp.id and fu.item_type = 'post'
            where fp.author_id = p.id and fu.user_id != fp.author_id and fu.created_at >= t_start
            group by fp.id
          ) s3
        ), 0) +
        -- Answer upvotes received (non-self, max 20 per answer): 1 pt
        coalesce((
          select sum(least(20, uv_cnt)) * 1
          from (
            select count(fu.user_id) as uv_cnt
            from public.forum_answers fa
            join public.forum_upvotes fu on fu.item_id = fa.id and fu.item_type = 'answer'
            where fa.author_id = p.id and fu.user_id != fa.author_id and fu.created_at >= t_start
            group by fa.id
          ) s4
        ), 0)
      )::bigint as pts_forum,

      -- 4. Mentorship Points
      (
        -- Completed as mentor: 10 pts
        coalesce((
          select count(*) * 10
          from public.mentorship_sessions ms
          join public.mentor_profiles mp on mp.id = ms.mentor_id
          where mp.user_id = p.id and ms.status = 'completed' and ms.created_at >= t_start
        ), 0) +
        -- Completed as mentee: 3 pts
        coalesce((select count(*) * 3 from public.mentorship_sessions ms where ms.mentee_id = p.id and ms.status = 'completed' and ms.created_at >= t_start), 0) +
        -- Code review completed (mentor): 8 pts
        coalesce((
          select count(*) * 8
          from public.code_reviews cr
          join public.mentor_profiles mp on mp.id = cr.mentor_id
          where mp.user_id = p.id and cr.status = 'resolved' and cr.created_at >= t_start
        ), 0)
      )::bigint as pts_mentorship,

      -- Earliest Activity Timestamp (for tie breaks)
      coalesce((
        select min(act_time)
        from (
          select min(registered_at) as act_time from public.event_registrations where user_id = p.id
          union all
          select min(created_at) as act_time from public.projects where owner_id = p.id
          union all
          select min(created_at) as act_time from public.forum_posts where author_id = p.id
          union all
          select min(created_at) as act_time from public.forum_answers where author_id = p.id
        ) u_acts
      ), p.created_at) as earliest_act,

      -- Raw counts for badge evaluation
      coalesce((select count(*) from public.event_registrations er where er.user_id = p.id), 0) as total_event_regs,
      coalesce((select count(*) from public.event_attendance ea where ea.user_id = p.id and ea.status = 'present'), 0) as total_event_atts,
      coalesce((
        (select count(*) from public.event_teams et where et.leader_id = p.id) +
        (select count(*) from public.event_team_members etm where etm.email_key = lower(trim(p.email)))
      ), 0) as total_hackathons,
      coalesce((select count(*) from public.projects pr where pr.owner_id = p.id), 0) as total_projects,
      coalesce((
        select count(*)
        from public.forum_answers fa
        join public.forum_posts fp on fp.accepted_answer_id = fa.id
        where fa.author_id = p.id and fp.author_id != fa.author_id
      ), 0) as total_accepted_answers,
      coalesce((
        select count(*)
        from public.mentorship_sessions ms
        join public.mentor_profiles mp on mp.id = ms.mentor_id
        where mp.user_id = p.id and ms.status = 'completed'
      ), 0) as total_mentor_sessions

    from public.profiles p
    where p.is_hidden_from_leaderboard = false
  ),
  scored_users as (
    select
      u.*,
      (u.pts_events + u.pts_projects + u.pts_forum + u.pts_mentorship)::bigint as pts_total,
      case
        when v_category = 'events' then u.pts_events
        when v_category = 'projects' then u.pts_projects
        when v_category = 'forum' then u.pts_forum
        when v_category = 'mentorship' then u.pts_mentorship
        else (u.pts_events + u.pts_projects + u.pts_forum + u.pts_mentorship)
      end::bigint as category_score
    from user_activities u
  ),
  ranked_users as (
    select
      s.*,
      rank() over (order by s.category_score desc, s.earliest_act asc) as rnk
    from scored_users s
  )
  select
    r.u_id as user_id,
    r.u_name as full_name,
    r.u_email as email,
    r.u_year as course_year,
    r.u_github as github_username,
    r.pts_events as events_points,
    r.pts_projects as projects_points,
    r.pts_forum as forum_points,
    r.pts_mentorship as mentorship_points,
    r.pts_total as total_points,
    r.category_score as score,
    r.rnk as rank,
    array_remove(array[
      case when (r.total_event_regs > 0 or r.total_event_atts > 0) then 'First Event' else null end,
      case when r.total_hackathons >= 3 then 'Hackathon Hero' else null end,
      case when r.total_accepted_answers >= 5 then 'Problem Solver' else null end,
      case when r.total_projects >= 3 then 'Builder' else null end,
      case when r.total_mentor_sessions >= 5 then 'Mentor' else null end,
      case when r.rnk <= 10 and r.category_score > 0 then 'Top 10 This Month' else null end
    ], null) as badges,
    r.earliest_act as first_activity_at
  from ranked_users r
  order by r.category_score desc, r.earliest_act asc
  limit p_limit
  offset p_offset;
end;
$$;

-- Grant access to get_leaderboard
grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;

-- 5. User Leaderboard Position Function (for Sticky Rank & Profile Insights)
create or replace function public.get_user_leaderboard_position(
  p_user_id uuid,
  p_time_filter text default 'all',
  p_category_filter text default 'overall'
)
returns table (
  user_id uuid,
  rank bigint,
  score bigint,
  total_points bigint,
  points_to_next_rank bigint,
  next_rank_score bigint,
  badges text[]
)
language plpgsql
stable
security definer
as $$
declare
  v_user_score bigint;
  v_user_rank bigint;
  v_next_score bigint;
begin
  return query
  with full_board as (
    select * from public.get_leaderboard(p_time_filter, p_category_filter, 10000, 0)
  ),
  target_user as (
    select * from full_board fb where fb.user_id = p_user_id
  ),
  higher_user as (
    select fb.score from full_board fb
    where fb.score > (select tu.score from target_user tu)
    order by fb.score asc
    limit 1
  )
  select
    tu.user_id,
    tu.rank,
    tu.score,
    tu.total_points,
    case
      when tu.rank = 1 then 0::bigint
      else coalesce((select hu.score from higher_user hu) - tu.score + 1, 0::bigint)
    end as points_to_next_rank,
    coalesce((select hu.score from higher_user hu), tu.score) as next_rank_score,
    tu.badges
  from target_user tu;
end;
$$;

grant execute on function public.get_user_leaderboard_position(uuid, text, text) to anon, authenticated;
