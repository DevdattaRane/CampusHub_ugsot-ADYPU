-- Part 2: Developer Forum
-- Timestamp: 20261117180000

create table if warm_posts_exists as
select 1 from information_schema.tables where table_name = 'forum_posts';

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('question', 'discussion', 'announcement')),
  title text not null,
  content text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  tags text[] not null default '{}',
  accepted_answer_id uuid,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_answers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_upvotes (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'answer')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'answer')),
  item_id uuid not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.forum_posts enable row level security;
alter table public.forum_answers enable row level security;
alter table public.forum_upvotes enable row level security;
alter table public.forum_reports enable row level security;

-- Policies for forum_posts
drop policy if exists "Forum posts are publicly readable" on public.forum_posts;
create policy "Forum posts are publicly readable"
  on public.forum_posts for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create posts" on public.forum_posts;
create policy "Authenticated users can create posts"
  on public.forum_posts for insert to authenticated
  with check (
    author_id = (select auth.uid()) and
    (type in ('question', 'discussion') or (select public.is_event_organizer()))
  );

drop policy if exists "Authors can update own posts and organizers can moderate" on public.forum_posts;
create policy "Authors can update own posts and organizers can moderate"
  on public.forum_posts for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (author_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authors and organizers can delete posts" on public.forum_posts;
create policy "Authors and organizers can delete posts"
  on public.forum_posts for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Policies for forum_answers
drop policy if exists "Forum answers are publicly readable" on public.forum_answers;
create policy "Forum answers are publicly readable"
  on public.forum_answers for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can add answers" on public.forum_answers;
create policy "Authenticated users can add answers"
  on public.forum_answers for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "Authors can update own answers and organizers can moderate" on public.forum_answers;
create policy "Authors can update own answers and organizers can moderate"
  on public.forum_answers for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (author_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authors and organizers can delete answers" on public.forum_answers;
create policy "Authors and organizers can delete answers"
  on public.forum_answers for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Policies for forum_upvotes
drop policy if exists "Upvotes are publicly readable" on public.forum_upvotes;
create policy "Upvotes are publicly readable"
  on public.forum_upvotes for select to anon, authenticated
  using (true);

drop policy if exists "Users can toggle own upvotes" on public.forum_upvotes;
create policy "Users can toggle own upvotes"
  on public.forum_upvotes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own upvotes" on public.forum_upvotes;
create policy "Users can delete own upvotes"
  on public.forum_upvotes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Policies for forum_reports
drop policy if exists "Users can submit reports" on public.forum_reports;
create policy "Users can submit reports"
  on public.forum_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "Organizers can view reports" on public.forum_reports;
create policy "Organizers can view reports"
  on public.forum_reports for select to authenticated
  using ((select public.is_event_organizer()));

grant select on public.forum_posts, public.forum_answers, public.forum_upvotes to anon, authenticated;
grant insert, update, delete on public.forum_posts, public.forum_answers, public.forum_upvotes to authenticated;
grant insert on public.forum_reports to authenticated;
grant select on public.forum_reports to authenticated;
