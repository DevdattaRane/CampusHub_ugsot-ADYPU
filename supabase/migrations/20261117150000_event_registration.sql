create table public.event_catalog (
  id text primary key,
  title text not null,
  capacity integer not null check (capacity > 0),
  registration_deadline date not null
);

insert into public.event_catalog (id, title, capacity, registration_deadline) values
  ('freshers-talk', 'Freshers’ tech talk', 120, '2026-10-16'),
  ('smart-campus-ideathon', 'Smart campus ideathon', 60, '2026-10-20'),
  ('git-workshop', 'Intro to Git & GitHub', 40, '2026-11-03'),
  ('oss-sprint', 'Open-source sprint', 60, '2026-11-06'),
  ('design-jam', 'UI/UX Design Jam', 30, '2026-11-09'),
  ('campus-hackathon', 'Campus Hackathon 2026', 100, '2026-11-10'),
  ('rapid-prototyping-workshop', 'Rapid Prototyping Workshop', 30, '2026-11-13'),
  ('student-maker-meetup', 'Student Maker Meetup', 50, '2026-11-13'),
  ('ml-circle', 'ML Paper Reading Circle', 25, '2026-11-17'),
  ('codefest', 'Inter-college Codefest', 200, '2026-11-15'),
  ('resume-clinic', 'Resume & LinkedIn clinic', 40, '2026-11-24'),
  ('global-ai-hackathon', 'Global AI Hackathon', 200, '2026-11-20')
on conflict (id) do update
set title = excluded.title,
    capacity = excluded.capacity,
    registration_deadline = excluded.registration_deadline;

alter table public.event_catalog enable row level security;
revoke all on public.event_catalog from anon, authenticated;
grant select on public.event_catalog to anon, authenticated;

create policy "Event catalog is public"
  on public.event_catalog for select to anon, authenticated
  using (true);

revoke insert, delete on public.event_registrations from authenticated;

create or replace function public.get_event_registration_statuses(p_event_ids text[])
returns table (
  event_id text,
  capacity integer,
  registration_deadline date,
  seats_left integer,
  is_registered boolean,
  registration_open boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    catalog.id,
    catalog.capacity,
    catalog.registration_deadline,
    greatest(catalog.capacity - count(registration.user_id)::integer, 0),
    coalesce(bool_or(registration.user_id = (select auth.uid())), false),
    catalog.registration_deadline >= (now() at time zone 'Asia/Kolkata')::date
      and count(registration.user_id) < catalog.capacity
  from public.event_catalog as catalog
  left join public.event_registrations as registration
    on registration.event_id = catalog.id
  where catalog.id = any(p_event_ids)
  group by catalog.id;
$$;

create or replace function public.register_for_event(p_event_id text)
returns table (
  result text,
  seats_left integer,
  capacity integer,
  registration_deadline date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  event_row public.event_catalog%rowtype;
  registration_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to register.';
  end if;

  select * into event_row
  from public.event_catalog
  where id = p_event_id
  for update;

  if not found then
    raise exception 'This event is not available for registration.';
  end if;

  select count(*)::integer into registration_count
  from public.event_registrations
  where event_id = p_event_id;

  if exists (
    select 1
    from public.event_registrations
    where event_id = p_event_id and user_id = current_user_id
  ) then
    return query select
      'already_registered'::text,
      greatest(event_row.capacity - registration_count, 0),
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  if event_row.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    return query select
      'deadline_passed'::text,
      greatest(event_row.capacity - registration_count, 0),
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  if registration_count >= event_row.capacity then
    return query select
      'full'::text,
      0,
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  insert into public.event_registrations (event_id, user_id)
  values (p_event_id, current_user_id);

  return query select
    'registered'::text,
    greatest(event_row.capacity - registration_count - 1, 0),
    event_row.capacity,
    event_row.registration_deadline;
end;
$$;

create or replace function public.cancel_event_registration(p_event_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to cancel a registration.';
  end if;

  delete from public.event_registrations
  where event_id = p_event_id and user_id = current_user_id;
  return found;
end;
$$;

revoke all on function public.get_event_registration_statuses(text[]) from public;
revoke all on function public.register_for_event(text) from public;
revoke all on function public.cancel_event_registration(text) from public;
grant execute on function public.get_event_registration_statuses(text[]) to anon, authenticated;
grant execute on function public.register_for_event(text) to authenticated;
grant execute on function public.cancel_event_registration(text) to authenticated;
