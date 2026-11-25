import 'server-only';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getEvent } from '@/lib/data';
import type { CampusEvent } from '@/lib/types';

export type EventRegistration = {
  id: string;
  eventId: string;
  attendeeEmail: string;
  attendeeName: string;
  registeredAt: string;
};

export type MyEventRegistration = {
  id: string;
  eventId: string;
  registeredAt: string;
};

export type EventAnnouncement = {
  id: string;
  eventId: string;
  authorEmail: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export type HackathonTeam = {
  id: string;
  eventId: string;
  name: string;
  leaderEmail: string;
  memberEmails: string[];
  createdAt: string;
};

export type EventAttendance = {
  eventId: string;
  attendeeEmail: string;
  status: 'present' | 'absent';
  updatedAt: string;
};

export type EventCertificate = {
  id: string;
  eventId: string;
  attendeeEmail: string;
  attendeeName: string;
  issuedAt: string;
};

export type EventStoreData = {
  version: 1;
  registrations: EventRegistration[];
  announcements: EventAnnouncement[];
  teams: HackathonTeam[];
  attendance: EventAttendance[];
  certificates: EventCertificate[];
};

export type EventRegistrationStatus = {
  eventId: string;
  capacity: number;
  registrationDeadline: string;
  seatsLeft: number;
  isRegistered: boolean;
  registrationOpen: boolean;
};

export type HackathonPageData = {
  capacity: number;
  registrationDeadline: string;
  teamSizeMin: number;
  teamSizeMax: number;
  theme: string;
  prize: string;
  rules: string[];
  announcements: EventAnnouncement[];
  teams: HackathonTeam[];
};

export class EventRegistrationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'EventRegistrationError';
  }
}

export class EventDataError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'EventDataError';
  }
}

const EMPTY_EVENT_STORE: EventStoreData = {
  version: 1,
  registrations: [],
  announcements: [],
  teams: [],
  attendance: [],
  certificates: [],
};

type RegistrationRow = Database['public']['Tables']['event_registrations']['Row'];
type AnnouncementRow = Database['public']['Tables']['event_announcements']['Row'];
type TeamRow = Database['public']['Tables']['event_teams']['Row'];
type AttendanceRow = Database['public']['Tables']['event_attendance']['Row'];
type CertificateRow = Database['public']['Tables']['event_certificates']['Row'];

function throwOnError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`Unable to ${operation}: ${error.message}`);
}

function registrationsChanged(current: EventRegistration[], next: EventRegistration[]): boolean {
  if (current.length !== next.length) return true;
  const nextById = new Map(next.map((registration) => [registration.id, registration]));
  return current.some((registration) => {
    const updated = nextById.get(registration.id);
    return !updated || registration.eventId !== updated.eventId
      || registration.attendeeEmail.toLowerCase() !== updated.attendeeEmail.toLowerCase()
      || registration.registeredAt !== updated.registeredAt;
  });
}

function profileFor(
  profiles: Map<string, { email: string; full_name: string }>,
  userId: string,
): { email: string; full_name: string } {
  const profile = profiles.get(userId);
  if (!profile) throw new Error(`No CampusHub profile exists for user ${userId}.`);
  return profile;
}

export async function getEventRegistrationStatuses(
  eventIds: string[],
): Promise<EventRegistrationStatus[]> {
  if (eventIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_event_registration_statuses', {
    p_event_ids: [...new Set(eventIds)],
  });
  throwOnError(error, 'load event registration availability');
  return (data ?? []).map((row) => ({
    eventId: row.event_id,
    capacity: row.capacity,
    registrationDeadline: row.registration_deadline,
    seatsLeft: row.seats_left,
    isRegistered: row.is_registered,
    registrationOpen: row.registration_open,
  }));
}

export async function getMyEventRegistrations(): Promise<MyEventRegistration[]> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && authError.status !== 401 && authError.name !== 'AuthSessionMissingError') {
    throw new Error(`Unable to verify event registrations: ${authError.message}`);
  }
  if (!authData.user) return [];

  const { data, error } = await supabase
    .from('event_registrations')
    .select('id,event_id,registered_at')
    .eq('user_id', authData.user.id)
    .order('registered_at', { ascending: false });
  throwOnError(error, 'load your event registrations');
  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    registeredAt: row.registered_at,
  }));
}

export async function getHackathonPageData(eventId: string): Promise<HackathonPageData> {
  const supabase = await createSupabaseServerClient();
  const { data: catalog, error: catalogError } = await supabase
    .from('event_catalog')
    .select('event_type,capacity,registration_deadline,team_size_min,team_size_max,theme,prize,rules')
    .eq('id', eventId)
    .maybeSingle();
  throwOnError(catalogError, 'load hackathon details');
  if (
    !catalog || catalog.event_type !== 'hackathon'
    || catalog.team_size_min === null || catalog.team_size_max === null
    || catalog.theme === null || catalog.prize === null
  ) {
    throw new EventDataError('This hackathon is not available.', 404);
  }

  const { data: announcementRows, error: announcementsError } = await supabase
    .from('event_announcements')
    .select('id,event_id,author_name,message,created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  throwOnError(announcementsError, 'load hackathon announcements');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && authError.status !== 401 && authError.name !== 'AuthSessionMissingError') {
    throw new Error(`Unable to verify the hackathon session: ${authError.message}`);
  }

  let teams: HackathonTeam[] = [];
  if (authData.user) {
    const { data: teamRows, error: teamsError } = await supabase
      .from('event_teams')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    throwOnError(teamsError, 'load your hackathon teams');
    const teamIds = (teamRows ?? []).map((team) => team.id);
    const { data: memberRows, error: membersError } = teamIds.length
      ? await supabase.from('event_team_members').select('team_id,member_email').in('team_id', teamIds)
      : { data: [], error: null };
    throwOnError(membersError, 'load hackathon team members');

    const membersByTeam = new Map<string, string[]>();
    for (const member of memberRows ?? []) {
      const emails = membersByTeam.get(member.team_id) ?? [];
      emails.push(member.member_email);
      membersByTeam.set(member.team_id, emails);
    }
    teams = (teamRows ?? []).map((team) => ({
      id: team.id,
      eventId: team.event_id,
      name: team.name,
      leaderEmail: team.leader_email,
      memberEmails: membersByTeam.get(team.id) ?? [],
      createdAt: team.created_at,
    }));
  }

  return {
    capacity: catalog.capacity,
    registrationDeadline: catalog.registration_deadline,
    teamSizeMin: catalog.team_size_min,
    teamSizeMax: catalog.team_size_max,
    theme: catalog.theme,
    prize: catalog.prize,
    rules: catalog.rules,
    announcements: (announcementRows ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      authorEmail: '',
      authorName: row.author_name,
      message: row.message,
      createdAt: row.created_at,
    })),
    teams,
  };
}

export async function postHackathonAnnouncement(
  eventId: string,
  message: string,
): Promise<EventAnnouncement> {
  const supabase = await createSupabaseServerClient();
  const user = await requireEventUser(supabase);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,full_name')
    .eq('id', user.id)
    .maybeSingle();
  throwOnError(profileError, 'verify announcement permissions');
  if (profile?.role !== 'organizer') {
    throw new EventDataError('Only event organizers can post announcements.', 403);
  }

  const { data, error } = await supabase
    .from('event_announcements')
    .insert({
      event_id: eventId,
      author_id: user.id,
      author_name: profile.full_name.trim() || user.email?.split('@')[0] || 'Organizer',
      message: message.trim(),
    })
    .select('id,event_id,author_name,message,created_at')
    .single();
  if (error?.code === '23514' || error?.code === '22023') {
    throw new EventDataError(error.message, 400);
  }
  throwOnError(error, 'post the hackathon announcement');
  if (!data) {
    throw new EventDataError('The announcement could not be saved.', 500);
  }
  return {
    id: data.id,
    eventId: data.event_id,
    authorEmail: '',
    authorName: data.author_name,
    message: data.message,
    createdAt: data.created_at,
  };
}

export async function createHackathonTeam(
  eventId: string,
  name: string,
  memberEmails: string[],
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  await requireEventUser(supabase);
  const { data, error } = await supabase.rpc('create_hackathon_team', {
    p_event_id: eventId,
    p_name: name.trim(),
    p_member_emails: memberEmails.map((email) => email.trim().toLowerCase()),
  });
  if (error) {
    if (error.code === '23505') {
      throw new EventDataError('One or more of these students are already on a team for this hackathon.', 409);
    }
    if (error.code === 'P0001' || error.code === '23514') {
      throw new EventDataError(error.message, 409);
    }
    if (error.code === '22023') throw new EventDataError(error.message, 400);
    throw new Error(`Unable to create the hackathon team: ${error.message}`);
  }
  if (!data) throw new Error('The hackathon team could not be created.');
  return data;
}

async function requireEventUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.status === 401 || error.name === 'AuthSessionMissingError') {
      throw new EventDataError('Sign in before using hackathon registration.', 401);
    }
    throw new Error(`Unable to verify the hackathon user: ${error.message}`);
  }
  if (!data.user) throw new EventDataError('Sign in before using hackathon registration.', 401);
  return data.user;
}

export async function registerForEvent(eventId: string): Promise<EventRegistrationStatus> {
  const supabase = await createSupabaseServerClient();
  await requireSignedIn(supabase, 'register');
  const { data, error } = await supabase.rpc('register_for_event', { p_event_id: eventId });
  throwOnError(error, 'register for the event');
  const result = data?.[0]?.result;
  if (result === 'full') throw new EventRegistrationError('This event is full.', 409);
  if (result === 'deadline_passed') {
    throw new EventRegistrationError('Registration for this event has closed.', 409);
  }
  if (result !== 'registered' && result !== 'already_registered') {
    throw new Error('The event registration could not be completed.');
  }

  if (result === 'registered') {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { createNotification } = await import('./notifications');
        const eventItem = getEvent(eventId);
        await createNotification({
          userId: authData.user.id,
          type: 'registration_confirmed',
          title: 'Event registration confirmed',
          message: eventItem ? `You are registered for "${eventItem.title}"` : 'Your event spot has been reserved.',
          linkUrl: `/events/${eventId}`,
        });
      }
    } catch {
      // Non-fatal
    }
  }

  const [status] = await getEventRegistrationStatuses([eventId]);
  if (!status) throw new Error('The event registration status could not be refreshed.');
  return status;
}

export async function cancelEventRegistration(eventId: string): Promise<EventRegistrationStatus> {
  const supabase = await createSupabaseServerClient();
  await requireSignedIn(supabase, 'cancel');
  const { error } = await supabase.rpc('cancel_event_registration', { p_event_id: eventId });
  throwOnError(error, 'cancel the event registration');
  const [status] = await getEventRegistrationStatuses([eventId]);
  if (!status) throw new Error('The event registration status could not be refreshed.');
  return status;
}

async function requireSignedIn(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  action: 'register' | 'cancel',
): Promise<void> {
  const actionDescription = action === 'cancel' ? 'cancel your registration' : 'register for events';
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.status === 401 || error.name === 'AuthSessionMissingError') {
      throw new EventRegistrationError(`Sign in to ${actionDescription}.`, 401);
    }
    throw new Error(`Unable to verify the event registration session: ${error.message}`);
  }
  if (!data.user) throw new EventRegistrationError(`Sign in to ${actionDescription}.`, 401);
}

export async function getServerEventStoreSnapshot(): Promise<EventStoreData> {
  return getEventStoreSnapshot();
}

export async function getEventStoreSnapshot(): Promise<EventStoreData> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && authError.status !== 401 && authError.name !== 'AuthSessionMissingError') {
    throw new Error(`Unable to verify the event data session: ${authError.message}`);
  }
  if (!authData.user) {
    const { data, error } = await supabase.from('event_announcements').select('*');
    throwOnError(error, 'load announcements');
    return {
      ...EMPTY_EVENT_STORE,
      announcements: (data ?? []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        authorEmail: '',
        authorName: row.author_name,
        message: row.message,
        createdAt: row.created_at,
      })),
    };
  }

  const [
    registrationsResult,
    announcementsResult,
    teamsResult,
    teamMembersResult,
    attendanceResult,
    certificatesResult,
  ] = await Promise.all([
    supabase.from('event_registrations').select('*'),
    supabase.from('event_announcements').select('*'),
    supabase.from('event_teams').select('*'),
    supabase.from('event_team_members').select('*'),
    supabase.from('event_attendance').select('*'),
    supabase.from('event_certificates').select('*'),
  ]);
  throwOnError(registrationsResult.error, 'load registrations');
  throwOnError(announcementsResult.error, 'load announcements');
  throwOnError(teamsResult.error, 'load teams');
  throwOnError(teamMembersResult.error, 'load team members');
  throwOnError(attendanceResult.error, 'load attendance');
  throwOnError(certificatesResult.error, 'load certificates');

  const userIds = [
    ...(registrationsResult.data ?? []).map((row) => row.user_id),
    ...(announcementsResult.data ?? []).map((row) => row.author_id),
    ...(teamsResult.data ?? []).map((row) => row.leader_id),
    ...(attendanceResult.data ?? []).map((row) => row.user_id),
    ...(certificatesResult.data ?? []).map((row) => row.user_id),
  ];
  const uniqueUserIds = [...new Set(userIds)];
  const profilesResult = uniqueUserIds.length
    ? await supabase.from('profiles').select('id,email,full_name').in('id', uniqueUserIds)
    : { data: [], error: null };
  throwOnError(profilesResult.error, 'load event participant profiles');
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      { email: profile.email, full_name: profile.full_name },
    ]),
  );
  const membersByTeam = new Map<string, string[]>();
  for (const member of teamMembersResult.data ?? []) {
    const members = membersByTeam.get(member.team_id) ?? [];
    members.push(member.member_email);
    membersByTeam.set(member.team_id, members);
  }

  return {
    version: 1,
    registrations: (registrationsResult.data ?? []).map((row: RegistrationRow) => {
      const profile = profileFor(profiles, row.user_id);
      return {
        id: row.id,
        eventId: row.event_id,
        attendeeEmail: profile.email,
        attendeeName: profile.full_name,
        registeredAt: row.registered_at,
      };
    }),
    announcements: (announcementsResult.data ?? []).map((row: AnnouncementRow) => {
      return {
        id: row.id,
        eventId: row.event_id,
        authorEmail: profiles.get(row.author_id)?.email ?? '',
        authorName: row.author_name,
        message: row.message,
        createdAt: row.created_at,
      };
    }),
    teams: (teamsResult.data ?? []).map((row: TeamRow) => {
      return {
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        leaderEmail: row.leader_email,
        memberEmails: membersByTeam.get(row.id) ?? [],
        createdAt: row.created_at,
      };
    }),
    attendance: (attendanceResult.data ?? []).map((row: AttendanceRow) => ({
      eventId: row.event_id,
      attendeeEmail: profileFor(profiles, row.user_id).email,
      status: row.status,
      updatedAt: row.updated_at,
    })),
    certificates: (certificatesResult.data ?? []).map((row: CertificateRow) => {
      const profile = profileFor(profiles, row.user_id);
      return {
        id: row.id,
        eventId: row.event_id,
        attendeeEmail: profile.email,
        attendeeName: profile.full_name,
        issuedAt: row.issued_at,
      };
    }),
  };
}

export async function updateEventStore(
  update: (current: EventStoreData) => EventStoreData,
): Promise<EventStoreData> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (authError.status === 401 || authError.name === 'AuthSessionMissingError') {
      throw new Error('Sign in before saving event data.');
    }
    throw new Error(`Unable to verify the event data session: ${authError.message}`);
  }
  if (!authData.user) throw new Error('Sign in before saving event data.');

  const current = await getEventStoreSnapshot();
  const updated = update(current);
  if (
    !updated || updated.version !== 1 || !Array.isArray(updated.registrations)
    || !Array.isArray(updated.announcements) || !Array.isArray(updated.teams)
    || !Array.isArray(updated.attendance) || !Array.isArray(updated.certificates)
  ) {
    throw new Error('The updated event data is invalid.');
  }
  const next: EventStoreData = {
    ...updated,
    teams: updated.teams.map((team) => {
      const members = [...new Set(team.memberEmails.map((email) => email.trim().toLowerCase()))];
      const leaderEmail = team.leaderEmail.trim().toLowerCase();
      if (leaderEmail && !members.includes(leaderEmail)) members.push(leaderEmail);
      return { ...team, memberEmails: members };
    }),
  };
  if (registrationsChanged(current.registrations, next.registrations)) {
    throw new Error('Manage registrations with registerForEvent or cancelEventRegistration.');
  }

  const emails = [
    ...next.announcements.map((row) => row.authorEmail),
    ...next.teams.map((row) => row.leaderEmail),
    ...next.attendance.map((row) => row.attendeeEmail),
    ...next.certificates.map((row) => row.attendeeEmail),
  ].map((email) => email.trim().toLowerCase());
  const profilesResult = emails.length
    ? await supabase.from('profiles').select('id,email').in('email', [...new Set(emails)])
    : { data: [], error: null };
  throwOnError(profilesResult.error, 'find event participant profiles');
  const userIdByEmail = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.email.toLowerCase(), profile.id]),
  );
  const userIdFor = (email: string): string => {
    const userId = userIdByEmail.get(email.trim().toLowerCase());
    if (!userId) throw new Error(`No signed-in CampusHub profile exists for ${email}.`);
    return userId;
  };

  await writeAnnouncements(supabase, current, next, userIdFor);
  await writeTeams(supabase, current, next, userIdFor);
  await writeAttendance(supabase, current, next, userIdFor);
  await writeCertificates(supabase, current, next, userIdFor);
  return next;
}

async function writeAnnouncements(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  current: EventStoreData,
  next: EventStoreData,
  userIdFor: (email: string) => string,
) {
  const changed = next.announcements.filter((row) => {
    const previous = current.announcements.find((item) => item.id === row.id);
    return !previous || previous.eventId !== row.eventId
      || previous.authorEmail.toLowerCase() !== row.authorEmail.toLowerCase()
      || previous.authorName !== row.authorName || previous.message !== row.message
      || previous.createdAt !== row.createdAt;
  });
  if (changed.length) {
    const { error } = await supabase.from('event_announcements').upsert(
      changed.map((row) => ({
        id: row.id,
        event_id: row.eventId,
        author_id: userIdFor(row.authorEmail),
        author_name: row.authorName,
        message: row.message,
        created_at: row.createdAt,
      })),
      { onConflict: 'id' },
    );
    throwOnError(error, 'save announcements');
  }
  for (const row of current.announcements) {
    if (!next.announcements.some((item) => item.id === row.id)) {
      const { error } = await supabase.from('event_announcements').delete().eq('id', row.id);
      throwOnError(error, 'remove an announcement');
    }
  }
}

async function writeTeams(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  current: EventStoreData,
  next: EventStoreData,
  userIdFor: (email: string) => string,
) {
  const changed = next.teams.filter((row) => {
    const previous = current.teams.find((item) => item.id === row.id);
    return !previous || previous.eventId !== row.eventId || previous.name !== row.name
      || previous.leaderEmail.toLowerCase() !== row.leaderEmail.toLowerCase();
  });
  if (changed.length) {
    const { error } = await supabase.from('event_teams').upsert(
      changed.map((row) => ({
        id: row.id,
        event_id: row.eventId,
        name: row.name,
        leader_id: userIdFor(row.leaderEmail),
        leader_email: row.leaderEmail.trim().toLowerCase(),
        created_at: row.createdAt,
      })),
      { onConflict: 'id' },
    );
    throwOnError(error, 'save teams');
  }

  for (const row of current.teams) {
    if (!next.teams.some((item) => item.id === row.id)) {
      const { error } = await supabase.from('event_teams').delete().eq('id', row.id);
      throwOnError(error, 'remove a team');
    }
  }

  const desiredMembers = next.teams.flatMap((team) =>
    [...new Set(team.memberEmails.map((email) => email.trim().toLowerCase()))]
      .map((email) => ({ eventId: team.eventId, teamId: team.id, email })),
  );
  for (const team of current.teams) {
    if (!next.teams.some((item) => item.id === team.id)) continue;
    for (const email of team.memberEmails) {
      const stillOnTeam = desiredMembers.some((member) =>
        member.teamId === team.id && member.email === email.trim().toLowerCase());
      if (!stillOnTeam) {
        const { error } = await supabase.from('event_team_members')
          .delete().eq('event_id', team.eventId).eq('member_email', email);
        throwOnError(error, 'remove a team member');
      }
    }
  }
  for (const team of next.teams) {
    const newMembers = [...new Set(team.memberEmails.map((email) => email.trim().toLowerCase()))]
      .filter((email) => email !== team.leaderEmail.trim().toLowerCase())
      .filter((email) => !current.teams.some((previous) =>
        previous.id === team.id
        && previous.eventId === team.eventId
        && previous.memberEmails.some((member) => member.trim().toLowerCase() === email)));
    if (newMembers.length) {
      const { error } = await supabase.from('event_team_members').upsert(
        newMembers.map((email) => ({
          event_id: team.eventId,
          team_id: team.id,
          member_email: email,
        })),
        { onConflict: 'event_id,email_key' },
      );
      throwOnError(error, 'save team members');
    }
  }
}

async function writeAttendance(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  current: EventStoreData,
  next: EventStoreData,
  userIdFor: (email: string) => string,
) {
  const changed = next.attendance.filter((row) => {
    const previous = current.attendance.find((item) =>
      item.eventId === row.eventId
      && item.attendeeEmail.toLowerCase() === row.attendeeEmail.toLowerCase());
    return !previous || previous.status !== row.status || previous.updatedAt !== row.updatedAt;
  });
  if (changed.length) {
    const { error } = await supabase.from('event_attendance').upsert(
      changed.map((row) => ({
        event_id: row.eventId,
        user_id: userIdFor(row.attendeeEmail),
        status: row.status,
        updated_at: row.updatedAt,
      })),
      { onConflict: 'event_id,user_id' },
    );
    throwOnError(error, 'save attendance');
  }
  for (const row of current.attendance) {
    if (!next.attendance.some((item) =>
      item.eventId === row.eventId && item.attendeeEmail.toLowerCase() === row.attendeeEmail.toLowerCase())) {
      const { error } = await supabase.from('event_attendance').delete()
        .eq('event_id', row.eventId).eq('user_id', userIdFor(row.attendeeEmail));
      throwOnError(error, 'remove attendance');
    }
  }
}

async function writeCertificates(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  current: EventStoreData,
  next: EventStoreData,
  userIdFor: (email: string) => string,
) {
  const changed = next.certificates.filter((row) => {
    const previous = current.certificates.find((item) => item.id === row.id);
    return !previous || previous.eventId !== row.eventId
      || previous.attendeeEmail.toLowerCase() !== row.attendeeEmail.toLowerCase()
      || previous.issuedAt !== row.issuedAt;
  });
  for (const row of current.certificates) {
    if (!next.certificates.some((item) =>
      item.id === row.id && item.eventId === row.eventId && item.issuedAt === row.issuedAt
      && item.attendeeEmail.toLowerCase() === row.attendeeEmail.toLowerCase())) {
      const { error } = await supabase.from('event_certificates').delete().eq('id', row.id);
      throwOnError(error, 'remove a certificate');
    }
  }
  if (changed.length) {
    const { error } = await supabase.from('event_certificates').insert(
      changed.map((row) => ({
        id: row.id,
        event_id: row.eventId,
        user_id: userIdFor(row.attendeeEmail),
        issued_at: row.issuedAt,
      })),
    );
    throwOnError(error, 'save certificates');
  }
}

export async function isEventOrganizer(email?: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (authError.status === 401 || authError.name === 'AuthSessionMissingError') return false;
    throw new Error(`Unable to verify organizer identity: ${authError.message}`);
  }
  if (!authData.user?.email) return false;
  if (email && email.trim().toLowerCase() !== authData.user.email.toLowerCase()) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  throwOnError(error, 'check organizer permissions');
  return data?.role === 'organizer';
}

export type EventAttendanceRecord = {
  userId: string;
  email: string;
  name: string;
  courseYear: string | null;
  registeredAt: string;
  status: 'present' | 'absent';
  updatedAt: string | null;
  certificateId?: string | null;
};

export type UserCertificate = {
  id: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  issuedAt: string;
};

export type VerifiedCertificate = {
  certificateId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  issuedAt: string;
  isValid: boolean;
};

export async function getEventAttendanceDetails(
  eventId: string,
): Promise<{ event: CampusEvent; records: EventAttendanceRecord[] }> {
  const event = getEvent(eventId);
  if (!event) throw new EventDataError(`Event ${eventId} not found.`, 404);

  const organizer = await isEventOrganizer();
  if (!organizer) {
    throw new EventDataError('Only organizers can view event attendance.', 403);
  }

  const supabase = await createSupabaseServerClient();

  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select('id, user_id, registered_at')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true });
  throwOnError(regError, 'load event registrations');

  const regRows = registrations ?? [];
  const userIds = [...new Set(regRows.map((r) => r.user_id))];

  const profilesResult = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, email, full_name, course_year')
        .in('id', userIds)
    : { data: [], error: null };
  throwOnError(profilesResult.error, 'load registrant profiles');

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p]),
  );

  const { data: attendanceList, error: attError } = await supabase
    .from('event_attendance')
    .select('user_id, status, updated_at')
    .eq('event_id', eventId);
  throwOnError(attError, 'load event attendance');

  const attendanceMap = new Map(
    (attendanceList ?? []).map((a) => [a.user_id, a]),
  );

  const { data: certList, error: certError } = await supabase
    .from('event_certificates')
    .select('id, user_id')
    .eq('event_id', eventId);
  throwOnError(certError, 'load event certificates');

  const certMap = new Map((certList ?? []).map((c) => [c.user_id, c.id]));

  const records: EventAttendanceRecord[] = regRows.map((reg) => {
    const prof = profileMap.get(reg.user_id);
    const att = attendanceMap.get(reg.user_id);
    return {
      userId: reg.user_id,
      email: prof?.email ?? '',
      name: prof?.full_name?.trim() || prof?.email?.split('@')[0] || 'Attendee',
      courseYear: prof?.course_year ?? null,
      registeredAt: reg.registered_at,
      status: att?.status ?? 'absent',
      updatedAt: att?.updated_at ?? null,
      certificateId: certMap.get(reg.user_id) ?? null,
    };
  });

  return { event, records };
}

export async function setAttendeeAttendance(
  eventId: string,
  userId: string,
  status: 'present' | 'absent',
): Promise<void> {
  const organizer = await isEventOrganizer();
  if (!organizer) {
    throw new EventDataError('Only organizers can update event attendance.', 403);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('event_attendance').upsert(
    {
      event_id: eventId,
      user_id: userId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,user_id' },
  );
  throwOnError(error, 'update attendee attendance');
}

export async function getMyCertificates(): Promise<UserCertificate[]> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return [];

  const { data, error } = await supabase
    .from('event_certificates')
    .select('id, event_id, issued_at')
    .eq('user_id', authData.user.id)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Failed to load my certificates:', error.message);
    return [];
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  const attendeeName = profile?.full_name?.trim() || authData.user.email?.split('@')[0] || 'Student';

  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventTitle: getEvent(row.event_id)?.title || row.event_id,
    attendeeName,
    issuedAt: row.issued_at,
  }));
}

export async function verifyCertificate(certificateId: string): Promise<VerifiedCertificate | null> {
  const supabase = await createSupabaseServerClient();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(certificateId.trim())) {
    return null;
  }

  const { data, error } = await supabase.rpc('verify_certificate', {
    p_certificate_id: certificateId.trim(),
  });

  if (error || !data || data.length === 0) {
    // Fallback: direct query
    const { data: cert, error: certErr } = await supabase
      .from('event_certificates')
      .select('id, event_id, user_id, issued_at')
      .eq('id', certificateId.trim())
      .maybeSingle();

    if (certErr || !cert) return null;

    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', cert.user_id)
      .maybeSingle();

    return {
      certificateId: cert.id,
      eventId: cert.event_id,
      eventTitle: getEvent(cert.event_id)?.title || cert.event_id,
      attendeeName: prof?.full_name || 'Attendee',
      issuedAt: cert.issued_at,
      isValid: true,
    };
  }

  const res = data[0];
  return {
    certificateId: res.certificate_id,
    eventId: res.event_id,
    eventTitle: res.event_title || getEvent(res.event_id)?.title || res.event_id,
    attendeeName: res.attendee_name || 'Attendee',
    issuedAt: res.issued_at,
    isValid: res.is_valid,
  };
}

export async function issueCertificateForAttendee(eventId: string, userId: string): Promise<string> {
  const organizer = await isEventOrganizer();
  if (!organizer) {
    throw new EventDataError('Only organizers can issue certificates.', 403);
  }

  const supabase = await createSupabaseServerClient();

  // Enforce attendance check
  const { data: att } = await supabase
    .from('event_attendance')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (att?.status !== 'present') {
    throw new EventDataError('Cannot issue certificate: attendee is not marked present.', 400);
  }

  const { data, error } = await supabase
    .from('event_certificates')
    .insert({ event_id: eventId, user_id: userId })
    .select('id')
    .single();

  if (error) {
    // If already exists, return existing
    const { data: existing } = await supabase
      .from('event_certificates')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existing) return existing.id;
    throw new EventDataError(`Failed to issue certificate: ${error.message}`, 500);
  }

  return data.id;
}

export function subscribeToEventStore(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('focus', onChange);
  return () => window.removeEventListener('focus', onChange);
}
