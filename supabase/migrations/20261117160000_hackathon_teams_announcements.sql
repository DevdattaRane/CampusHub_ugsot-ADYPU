alter table public.event_catalog
  add column event_type text not null default 'event'
    check (event_type in ('event', 'hackathon')),
  add column team_size_min integer,
  add column team_size_max integer,
  add column theme text,
  add column prize text,
  add column rules jsonb not null default '[]'::jsonb,
  add constraint event_catalog_team_size_check check (
    (event_type = 'event' and team_size_min is null and team_size_max is null)
    or (
      event_type = 'hackathon'
      and team_size_min >= 1
      and team_size_max >= team_size_min
      and theme is not null
      and prize is not null
      and jsonb_typeof(rules) = 'array'
    )
  );

update public.event_catalog
set event_type = 'hackathon',
    team_size_min = 1,
    team_size_max = 4,
    theme = 'To be announced',
    prize = 'To be announced',
    rules = '[]'::jsonb
where id in ('smart-campus-ideathon', 'campus-hackathon', 'global-ai-hackathon');

create unique index event_teams_one_leader_per_hackathon
  on public.event_teams (event_id, leader_id);

revoke update on public.event_teams from authenticated;
grant update (name) on public.event_teams to authenticated;

create or replace function public.validate_hackathon_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.event_catalog
    where id = new.event_id and event_type = 'hackathon'
  ) then
    raise exception 'Announcements are only available for hackathons.'
      using errcode = '23514';
  end if;

  if length(btrim(new.message)) > 1000 then
    raise exception 'Announcements must be 1000 characters or fewer.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_announcement
  before insert or update on public.event_announcements
  for each row execute function public.validate_hackathon_announcement();

create or replace function public.validate_hackathon_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_record public.event_catalog%rowtype;
  current_user_id uuid := (select auth.uid());
  current_email text := lower(btrim((select auth.jwt() ->> 'email')));
begin
  if current_user_id is null or current_email is null then
    raise exception 'Sign in to create a hackathon team.'
      using errcode = '28000';
  end if;

  if new.leader_id <> current_user_id or lower(btrim(new.leader_email)) <> current_email then
    raise exception 'The signed-in user must be the team leader.'
      using errcode = '42501';
  end if;

  if length(btrim(new.name)) not between 1 and 80 then
    raise exception 'Team names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  select * into event_record
  from public.event_catalog
  where id = new.event_id
  for update;

  if not found or event_record.event_type <> 'hackathon' then
    raise exception 'Teams are only available for listed hackathons.'
      using errcode = '23514';
  end if;

  if event_record.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Team registration for this hackathon has closed.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_team
  before insert on public.event_teams
  for each row execute function public.validate_hackathon_team();

create or replace function public.validate_hackathon_team_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_event_id text;
  team_capacity integer;
  current_member_count integer;
begin
  select teams.event_id, catalog.team_size_max
  into team_event_id, team_capacity
  from public.event_teams as teams
  join public.event_catalog as catalog on catalog.id = teams.event_id
  where teams.id = new.team_id and catalog.event_type = 'hackathon'
  for update of teams;

  if not found or new.event_id <> team_event_id then
    raise exception 'The team member does not match this hackathon.'
      using errcode = '23514';
  end if;

  new.member_email := lower(btrim(new.member_email));
  if new.member_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address for each team member.'
      using errcode = '22023';
  end if;

  select count(*)::integer into current_member_count
  from public.event_team_members
  where team_id = new.team_id;

  if current_member_count + 1 > team_capacity then
    raise exception 'This team has reached the maximum size for this hackathon.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_team_member
  before insert on public.event_team_members
  for each row execute function public.validate_hackathon_team_member();

create or replace function public.enforce_hackathon_team_minimum()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  minimum_size integer;
  actual_size integer;
begin
  select catalog.team_size_min into minimum_size
  from public.event_teams as teams
  join public.event_catalog as catalog on catalog.id = teams.event_id
  where teams.id = new.id and catalog.event_type = 'hackathon';

  if not found then
    return null;
  end if;

  select count(*)::integer into actual_size
  from public.event_team_members
  where team_id = new.id;

  if actual_size < minimum_size then
    raise exception 'A team must have at least % members, including its leader.', minimum_size
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create constraint trigger enforce_hackathon_team_minimum
  after insert on public.event_teams
  deferrable initially deferred
  for each row execute function public.enforce_hackathon_team_minimum();

revoke delete on public.event_team_members from authenticated;

create or replace function public.create_hackathon_team(
  p_event_id text,
  p_name text,
  p_member_emails text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  leader_email text := lower(btrim((select auth.jwt() ->> 'email')));
  event_record public.event_catalog%rowtype;
  normalized_emails text[];
  team_size integer;
  created_team_id uuid;
begin
  if current_user_id is null or leader_email is null then
    raise exception 'Sign in to create a hackathon team.'
      using errcode = '28000';
  end if;

  if p_name is null or length(btrim(p_name)) not between 1 and 80 then
    raise exception 'Team names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_member_emails, '{}'::text[])) as invite(email)
    where invite.email is null
      or btrim(invite.email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then
    raise exception 'Enter a valid email address for each team member.'
      using errcode = '22023';
  end if;

  select * into event_record
  from public.event_catalog
  where id = p_event_id;

  if not found or event_record.event_type <> 'hackathon' then
    raise exception 'Teams are only available for listed hackathons.'
      using errcode = '23514';
  end if;

  if event_record.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Team registration for this hackathon has closed.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.event_teams
    where event_id = p_event_id and leader_id = current_user_id
  ) or exists (
    select 1 from public.event_team_members
    where event_id = p_event_id and email_key = leader_email
  ) then
    raise exception 'You are already on a team for this hackathon.'
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct lower(btrim(invite.email))), '{}'::text[])
  into normalized_emails
  from unnest(coalesce(p_member_emails, '{}'::text[])) as invite(email)
  where lower(btrim(invite.email)) <> leader_email;

  team_size := cardinality(normalized_emails) + 1;
  if team_size < event_record.team_size_min or team_size > event_record.team_size_max then
    raise exception 'Team size must be between % and % members, including the leader.',
      event_record.team_size_min, event_record.team_size_max
      using errcode = '22023';
  end if;

  insert into public.event_teams (event_id, name, leader_id, leader_email)
  values (p_event_id, btrim(p_name), current_user_id, leader_email)
  returning id into created_team_id;

  insert into public.event_team_members (event_id, team_id, member_email)
  select p_event_id, created_team_id, invite.email
  from unnest(normalized_emails) as invite(email);

  return created_team_id;
exception
  when unique_violation then
    raise exception 'One or more of these students are already on a team for this hackathon.'
      using errcode = '23505';
end;
$$;

revoke all on function public.create_hackathon_team(text, text, text[]) from public;
grant execute on function public.create_hackathon_team(text, text, text[]) to authenticated;
