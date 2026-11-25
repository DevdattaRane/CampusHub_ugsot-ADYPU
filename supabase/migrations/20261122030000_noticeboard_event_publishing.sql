alter table public.event_catalog
  add column category text not null default 'Meetup',
  add column description text not null default '',
  add column mode text not null default 'Offline'
    check (mode in ('Online', 'Offline')),
  add column event_where text not null default 'In campus'
    check (event_where in ('In campus', 'Out of campus')),
  add column place text not null default '',
  add column start_date date,
  add column end_date date,
  add column noticeboard_managed boolean not null default false,
  add column is_published boolean not null default false,
  add column noticeboard_updated_at timestamptz not null default now(),
  add constraint event_catalog_category_check
    check (category in ('Hackathon', 'Workshop', 'Contest', 'Meetup', 'Sprint', 'Design jam')),
  add constraint event_catalog_date_range_check
    check (end_date is null or (start_date is not null and end_date >= start_date)),
  add constraint event_catalog_registration_deadline_check
    check (start_date is null or registration_deadline <= start_date),
  add constraint event_catalog_published_details_check
    check (
      not is_published
      or (
        start_date is not null
        and length(trim(description)) > 0
        and length(trim(place)) > 0
      )
    );

create policy "Organizers create event catalog entries"
  on public.event_catalog for insert to authenticated
  with check (
    (select public.is_event_organizer())
    and noticeboard_managed
  );

create policy "Organizers update event catalog entries"
  on public.event_catalog for update to authenticated
  using (
    (select public.is_event_organizer())
    and noticeboard_managed
  )
  with check (
    (select public.is_event_organizer())
    and noticeboard_managed
  );

drop policy if exists "Event catalog is public" on public.event_catalog;

create policy "Public users can read published event catalog entries"
  on public.event_catalog for select to anon
  using (
    is_published
    or (not noticeboard_managed and event_type = 'hackathon')
  );

create policy "Campus users can read event catalog entries"
  on public.event_catalog for select to authenticated
  using (
    is_published
    or (not noticeboard_managed and event_type = 'hackathon')
    or (select public.is_event_organizer())
  );

grant insert, update on public.event_catalog to authenticated;
