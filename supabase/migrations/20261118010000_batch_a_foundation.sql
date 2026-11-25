-- =============================================================================
-- Migration: 20261118010000_batch_a_foundation.sql
-- Batch A: Foundation (Onboarding, Auth Hardening, In-App Notifications,
-- Global Search Support, Universal Reports & Moderation, Spam Protections)
-- =============================================================================

-- 1. Extend profiles for Onboarding, Privacy, and Moderation
alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists goals text[] not null default '{}',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists is_profile_private boolean not null default false,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists warning_count integer not null default 0,
  add column if not exists suspension_reason text;

-- 2. Extend soft-delete flag on user-generated content
alter table if exists public.forum_posts
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.forum_answers
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.projects
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.project_comments
  add column if not exists is_hidden boolean not null default false;

-- 3. Enhance role and moderation security guard on profiles
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
      raise exception 'Unauthorized: Only organizers can alter leaderboard moderation flags.';
    end if;
  end if;

  -- Prevent suspension or warning count alteration by non-organizers
  if (
    (NEW.is_suspended is distinct from OLD.is_suspended) or
    (NEW.warning_count is distinct from OLD.warning_count) or
    (NEW.suspension_reason is distinct from OLD.suspension_reason)
  ) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Only organizers can warn or suspend users.';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 4. In-App Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert to authenticated
  with check (true);

grant select, insert, update, delete on public.notifications to authenticated;

-- 5. Notification Preferences Table
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default false,
  notify_team_invites boolean not null default true,
  notify_event_updates boolean not null default true,
  notify_mentorship boolean not null default true,
  notify_forum boolean not null default true,
  notify_projects boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.notification_preferences;
create policy "Users can read own preferences"
  on public.notification_preferences for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can upsert own preferences" on public.notification_preferences;
create policy "Users can upsert own preferences"
  on public.notification_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.notification_preferences to authenticated;

-- 6. Universal Reports Table (Extends forum reporting to projects, comments & users)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('forum_post', 'forum_answer', 'project', 'project_comment', 'user')),
  item_id text not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')),
  moderator_id uuid references auth.users(id),
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_reports_status_date
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Users can submit reports" on public.reports;
create policy "Users can submit reports"
  on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "Users can view their submitted reports" on public.reports;
create policy "Users can view their submitted reports"
  on public.reports for select to authenticated
  using (
    reporter_id = (select auth.uid()) or
    exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer')
  );

drop policy if exists "Organizers can update reports" on public.reports;
create policy "Organizers can update reports"
  on public.reports for update to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'));

grant select, insert, update on public.reports to authenticated;

-- 7. Moderation Audit Log Table
create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.moderation_logs enable row level security;

drop policy if exists "Organizers can view moderation logs" on public.moderation_logs;
create policy "Organizers can view moderation logs"
  on public.moderation_logs for select to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'));

drop policy if exists "Organizers can insert moderation logs" on public.moderation_logs;
create policy "Organizers can insert moderation logs"
  on public.moderation_logs for insert to authenticated
  with check (
    moderator_id = (select auth.uid()) and
    exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer')
  );

grant select, insert on public.moderation_logs to authenticated;
