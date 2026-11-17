-- Part 1: Event Certificates and Verification
-- Timestamp: 20261117170000

-- Ensure function to verify certificates publicly
create or replace function public.verify_certificate(p_certificate_id uuid)
returns table (
  certificate_id uuid,
  event_id text,
  event_title text,
  attendee_name text,
  issued_at timestamptz,
  is_valid boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    c.id as certificate_id,
    c.event_id,
    coalesce(cat.title, c.event_id) as event_title,
    p.full_name as attendee_name,
    c.issued_at,
    true as is_valid
  from public.event_certificates c
  join public.profiles p on p.id = c.user_id
  left join public.event_catalog cat on cat.id = c.event_id
  where c.id = p_certificate_id;
end;
$$;

revoke all on function public.verify_certificate(uuid) from public;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- Function for organizers to issue a certificate to a present attendee
create or replace function public.issue_event_certificate(p_event_id text, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_certificate_id uuid;
begin
  if not (select public.is_event_organizer()) then
    raise exception 'Forbidden: Only organizers can issue certificates.';
  end if;

  if not exists (
    select 1
    from public.event_attendance
    where event_id = p_event_id
      and user_id = p_user_id
      and status = 'present'
  ) then
    raise exception 'Attendee must be marked present to receive a certificate.';
  end if;

  insert into public.event_certificates (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id, user_id)
  do update set issued_at = now()
  returning id into v_certificate_id;

  return v_certificate_id;
end;
$$;

revoke all on function public.issue_event_certificate(text, uuid) from public;
grant execute on function public.issue_event_certificate(text, uuid) to authenticated;
