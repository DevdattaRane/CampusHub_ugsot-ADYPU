-- Part 4: Mentorship and Code Reviews
-- Timestamp: 20261117200000

create table if not exists public.mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bio text not null,
  skills text[] not null default '{}',
  areas text[] not null default '{}',
  availability_slots text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentorship_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  mentee_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  date date not null,
  topic text not null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, date, slot)
);

create table if not exists public.code_reviews (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  github_url text,
  code_snippet text,
  language text not null default 'Other',
  notes text not null,
  mentor_id uuid references public.mentor_profiles(id) on delete set null,
  feedback text,
  status text not null default 'open' check (status in ('open', 'claimed', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS setup
alter table public.mentor_profiles enable row level security;
alter table public.mentorship_sessions enable row level security;
alter table public.code_reviews enable row level security;

-- Mentor profiles policies
drop policy if exists "Approved mentor profiles are publicly readable" on public.mentor_profiles;
create policy "Approved mentor profiles are publicly readable"
  on public.mentor_profiles for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authenticated users can apply for mentorship" on public.mentor_profiles;
create policy "Authenticated users can apply for mentorship"
  on public.mentor_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Mentors can update own details, organizers can approve" on public.mentor_profiles;
create policy "Mentors can update own details, organizers can approve"
  on public.mentor_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (user_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Mentorship sessions policies
drop policy if exists "Participants can view their sessions" on public.mentorship_sessions;
create policy "Participants can view their sessions"
  on public.mentorship_sessions for select to authenticated
  using (
    mentee_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = mentorship_sessions.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

drop policy if exists "Mentees can book sessions" on public.mentorship_sessions;
create policy "Mentees can book sessions"
  on public.mentorship_sessions for insert to authenticated
  with check (mentee_id = (select auth.uid()));

drop policy if exists "Session participants can update status" on public.mentorship_sessions;
create policy "Session participants can update status"
  on public.mentorship_sessions for update to authenticated
  using (
    mentee_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = mentorship_sessions.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

-- Code reviews policies
drop policy if exists "Code reviews are viewable by authenticated users" on public.code_reviews;
create policy "Code reviews are viewable by authenticated users"
  on public.code_reviews for select to authenticated
  using (true);

drop policy if exists "Users can request code reviews" on public.code_reviews;
create policy "Users can request code reviews"
  on public.code_reviews for insert to authenticated
  with check (requester_id = (select auth.uid()));

drop policy if exists "Requesters and mentors can update code reviews" on public.code_reviews;
create policy "Requesters and mentors can update code reviews"
  on public.code_reviews for update to authenticated
  using (
    requester_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = code_reviews.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

grant select on public.mentor_profiles to anon, authenticated;
grant insert, update on public.mentor_profiles to authenticated;
grant select, insert, update on public.mentorship_sessions, public.code_reviews to authenticated;
