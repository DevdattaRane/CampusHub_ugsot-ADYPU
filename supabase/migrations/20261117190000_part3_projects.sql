-- Part 3: Project Showcase
-- Timestamp: 20261117190000

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  github_url text,
  demo_url text,
  image_url text,
  looking_for_collaborators boolean not null default false,
  roles_needed text[] not null default '{}',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_collaborations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  role_interested text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS setup
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_bookmarks enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_collaborations enable row level security;

-- Projects policies
drop policy if exists "Projects are publicly readable" on public.projects;
create policy "Projects are publicly readable"
  on public.projects for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create projects" on public.projects;
create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update own projects" on public.projects;
create policy "Owners can update own projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (owner_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Owners and organizers can delete projects" on public.projects;
create policy "Owners and organizers can delete projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Likes policies
drop policy if exists "Likes are publicly readable" on public.project_likes;
create policy "Likes are publicly readable"
  on public.project_likes for select to anon, authenticated
  using (true);

drop policy if exists "Users can toggle own likes" on public.project_likes;
create policy "Users can toggle own likes"
  on public.project_likes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own likes" on public.project_likes;
create policy "Users can remove own likes"
  on public.project_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Bookmarks policies
drop policy if exists "Users can view own bookmarks" on public.project_bookmarks;
create policy "Users can view own bookmarks"
  on public.project_bookmarks for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add own bookmarks" on public.project_bookmarks;
create policy "Users can add own bookmarks"
  on public.project_bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own bookmarks" on public.project_bookmarks;
create policy "Users can remove own bookmarks"
  on public.project_bookmarks for delete to authenticated
  using (user_id = (select auth.uid()));

-- Comments policies
drop policy if exists "Comments are publicly readable" on public.project_comments;
create policy "Comments are publicly readable"
  on public.project_comments for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can post comments" on public.project_comments;
create policy "Authenticated users can post comments"
  on public.project_comments for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own comments and project owner can moderate" on public.project_comments;
create policy "Users can delete own comments and project owner can moderate"
  on public.project_comments for delete to authenticated
  using (
    user_id = (select auth.uid()) or
    exists (
      select 1 from public.projects
      where id = project_comments.project_id and owner_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

-- Collaboration requests policies
drop policy if exists "Users can view their collaborations" on public.project_collaborations;
create policy "Users can view their collaborations"
  on public.project_collaborations for select to authenticated
  using (
    sender_id = (select auth.uid()) or
    exists (
      select 1 from public.projects
      where id = project_collaborations.project_id and owner_id = (select auth.uid())
    )
  );

drop policy if exists "Users can send collaboration requests" on public.project_collaborations;
create policy "Users can send collaboration requests"
  on public.project_collaborations for insert to authenticated
  with check (sender_id = (select auth.uid()));

drop policy if exists "Project owners can update collaboration status" on public.project_collaborations;
create policy "Project owners can update collaboration status"
  on public.project_collaborations for update to authenticated
  using (
    exists (
      select 1 from public.projects
      where id = project_collaborations.project_id and owner_id = (select auth.uid())
    )
  );

grant select on public.projects, public.project_likes, public.project_comments to anon, authenticated;
grant select on public.project_bookmarks, public.project_collaborations to authenticated;
grant insert, update, delete on public.projects, public.project_likes, public.project_bookmarks, public.project_comments, public.project_collaborations to authenticated;
