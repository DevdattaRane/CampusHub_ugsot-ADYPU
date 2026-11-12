/**
 * Sample data for the MVP. Swap these arrays for database queries
 * (e.g. Supabase or Firebase) once the backend is ready.
 */
import type { CampusEvent, Highlight, Post, Student } from './types';

export const CURRENT_USER_ID = 'aarav';

export const events: CampusEvent[] = [
  { id: 'freshers-talk', title: 'Freshers’ tech talk', type: 'Meetup', mode: 'Offline', where: 'In campus', place: 'Seminar Hall, Block A', start: '2026-10-17', deadline: '2026-10-16', registerUrl: '#' },
  { id: 'smart-campus-ideathon', title: 'Smart campus ideathon', type: 'Hackathon', mode: 'Offline', where: 'In campus', place: 'Innovation Lab', start: '2026-10-24', end: '2026-10-25', deadline: '2026-10-20', registerUrl: '#' },
  { id: 'git-workshop', title: 'Intro to Git & GitHub', type: 'Workshop', mode: 'Offline', where: 'In campus', place: 'Seminar Hall, Block A', start: '2026-11-04', deadline: '2026-11-03', registerUrl: '#' },
  { id: 'oss-sprint', title: 'Open-source sprint', type: 'Sprint', mode: 'Online', where: 'Out of campus', place: 'Online, Discord', start: '2026-11-07', deadline: '2026-11-06', registerUrl: '#' },
  { id: 'design-jam', title: 'UI/UX Design Jam', type: 'Design jam', mode: 'Online', where: 'Out of campus', place: 'Online', start: '2026-11-11', deadline: '2026-11-09', registerUrl: '#' },
  { id: 'campus-hackathon', title: 'Campus Hackathon 2026', type: 'Hackathon', mode: 'Offline', where: 'In campus', place: 'Main Auditorium', start: '2026-11-14', end: '2026-11-15', deadline: '2026-11-10', registerUrl: '#' },
  { id: 'rapid-prototyping-workshop', title: 'Rapid Prototyping Workshop', type: 'Workshop', mode: 'Offline', where: 'In campus', place: 'Innovation Lab', start: '2026-11-14', deadline: '2026-11-13', registerUrl: '#' },
  { id: 'student-maker-meetup', title: 'Student Maker Meetup', type: 'Meetup', mode: 'Offline', where: 'In campus', place: 'Project Studio', start: '2026-11-14', end: '2026-11-15', deadline: '2026-11-13', registerUrl: '#' },
  { id: 'ml-circle', title: 'ML Paper Reading Circle', type: 'Meetup', mode: 'Offline', where: 'In campus', place: 'Library, Room 2', start: '2026-11-18', deadline: '2026-11-17', registerUrl: '#' },
  { id: 'codefest', title: 'Inter-college Codefest', type: 'Contest', mode: 'Offline', where: 'Out of campus', place: '[Host college, city]', start: '2026-11-21', deadline: '2026-11-15', registerUrl: '#' },
  { id: 'resume-clinic', title: 'Resume & LinkedIn clinic', type: 'Workshop', mode: 'Offline', where: 'In campus', place: 'Placement Cell', start: '2026-11-25', deadline: '2026-11-24', registerUrl: '#' },
  { id: 'global-ai-hackathon', title: 'Global AI Hackathon', type: 'Hackathon', mode: 'Online', where: 'Out of campus', place: 'Online', start: '2026-11-27', end: '2026-11-29', deadline: '2026-11-20', registerUrl: '#' },
];

const links = { linkedin: 'linkedin.com/in/[username]', github: 'github.com/[username]', x: 'x.com/[username]', portfolio: '[yourportfolio.dev]' };

export const students: Student[] = [
  {
    id: 'aarav', name: 'Aarav Patil', handle: 'aaravp', branch: 'CSE', year: '3rd year',
    bio: 'Full-stack dev who likes shipping small tools fast. Looking for an ML person for Campus Hackathon 2026.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Figma', 'Tailwind'], lookingForTeam: true, links,
    achievements: [
      { title: 'Finalist, Smart campus ideathon', date: 'Oct 2026', verified: true },
      { title: 'Built the attendance tracker used by the CSE dept.', date: 'Jul 2026' },
    ],
    going: ['campus-hackathon', 'git-workshop'], profileCompleteness: 80,
  },
  { id: 'sneha', name: 'Sneha Kulkarni', handle: 'snehak', branch: 'AI & DS', year: '2nd year', bio: 'ML and data pipelines.', skills: ['Python', 'ML', 'Pandas'], lookingForTeam: true, links, achievements: [{ title: '2nd place, inter-college ML challenge', date: 'Oct 2026', verified: true }], going: ['global-ai-hackathon'], profileCompleteness: 70 },
  { id: 'rohan', name: 'Rohan Deshmukh', handle: 'rohand', branch: 'CSE', year: '4th year', bio: 'Infra and backend.', skills: ['Go', 'Docker', 'Kubernetes'], lookingForTeam: false, links, achievements: [{ title: 'First open-source PR merged', date: 'Oct 2026' }], going: ['oss-sprint'], profileCompleteness: 90 },
  { id: 'isha', name: 'Isha Joshi', handle: 'ishaj', branch: 'IT', year: '2nd year', bio: 'Product design and prototyping.', skills: ['Figma', 'UI/UX', 'Webflow'], lookingForTeam: false, links, achievements: [{ title: 'Best UI, 24-hour design jam', date: 'Oct 2026', verified: true }], going: ['design-jam'], profileCompleteness: 85 },
  { id: 'kabir', name: 'Kabir Shaikh', handle: 'kabirs', branch: 'CSE', year: '3rd year', bio: 'Mobile apps with Flutter.', skills: ['Flutter', 'Firebase', 'Dart'], lookingForTeam: true, links, achievements: [], going: ['campus-hackathon'], profileCompleteness: 60 },
  { id: 'meera', name: 'Meera Iyer', handle: 'meerai', branch: 'AI & DS', year: '3rd year', bio: 'Deep learning research.', skills: ['ML', 'PyTorch', 'Python'], lookingForTeam: false, links, achievements: [], going: ['ml-circle'], profileCompleteness: 75 },
  { id: 'arjun', name: 'Arjun Nair', handle: 'arjunn', branch: 'CSE', year: '1st year', bio: 'Competitive programming.', skills: ['C++', 'DSA'], lookingForTeam: true, links, achievements: [], going: ['codefest'], profileCompleteness: 50 },
  { id: 'tanvi', name: 'Tanvi More', handle: 'tanvim', branch: 'IT', year: '4th year', bio: 'Frontend engineering.', skills: ['React', 'TypeScript', 'Next.js'], lookingForTeam: false, links, achievements: [], going: [], profileCompleteness: 65 },
  { id: 'dev', name: 'Dev Mehta', handle: 'devm', branch: 'CSE', year: '2nd year', bio: 'Backend with Django.', skills: ['Python', 'Django', 'Flutter'], lookingForTeam: true, links, achievements: [], going: [], profileCompleteness: 55 },
];

export const highlights: Highlight[] = [
  { id: 'h1', studentId: 'sneha', text: 'placed 2nd at an inter-college ML challenge.', badge: 'Podium' },
  { id: 'h2', studentId: 'rohan', text: 'got his first open-source pull request merged.', badge: 'First PR' },
  { id: 'h3', studentId: 'isha', text: 'won Best UI at a 24-hour design jam.', badge: 'Award' },
];

export const posts: Post[] = [
  { id: 'p1', tag: 'Find teammate', authorId: 'kabir', createdAt: '2026-10-30T11:00:00+05:30', title: 'Need a backend dev for Campus Hackathon 2026', body: 'Team of 3 so far (Flutter + design). Looking for someone comfortable with Node or Django.', score: 14, replies: 6, eventId: 'campus-hackathon' },
  { id: 'p2', tag: 'Need help', authorId: 'dev', createdAt: '2026-10-30T09:00:00+05:30', title: 'Firebase auth keeps logging me out on refresh', body: 'Using the web SDK with React. The user is null for a moment on every reload. What am I missing?', score: 8, replies: 3 },
  { id: 'p3', tag: 'Ask', authorId: 'arjun', createdAt: '2026-10-29T18:00:00+05:30', title: 'Which electives are best for an ML track?', body: 'First year here. Seniors, which electives actually helped you?', score: 21, replies: 9 },
  { id: 'p4', tag: 'Showcase', authorId: 'isha', createdAt: '2026-10-29T15:00:00+05:30', title: 'Redesigned our canteen menu app, feedback welcome', body: 'Figma link in comments. Mostly worked on the ordering flow.', score: 17, replies: 5 },
  { id: 'p5', tag: 'Find teammate', authorId: 'sneha', createdAt: '2026-10-28T12:00:00+05:30', title: 'ML person looking for a team for Global AI Hackathon', body: 'Comfortable with PyTorch and data pipelines. Would love a frontend + backend pair.', score: 11, replies: 4, eventId: 'global-ai-hackathon' },
];

export const getStudent = (id: string) => students.find((s) => s.id === id);
export const getEvent = (id: string) => events.find((e) => e.id === id);
export const studentIndex = (id: string) => Math.max(0, students.findIndex((s) => s.id === id));
