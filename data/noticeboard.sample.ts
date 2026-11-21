export type NoticeboardEventSample = {
  id: string;
  category: string;
  title: string;
  description: string;
  when: string;
  where: string;
};

export type NoticeboardAchievementSample = {
  id: string;
  category: string;
  title: string;
  description: string;
};

export const noticeboardEventSamples: readonly NoticeboardEventSample[] = [
  {
    id: 'sample-build-night',
    category: 'BUILD / WORKSHOP',
    title: 'Campus build night',
    description: 'A demonstration listing for a student-led make-and-share session.',
    when: 'Sample date / Nov 28',
    where: 'Sample venue / UGSOT studio',
  },
  {
    id: 'sample-peer-learning',
    category: 'LEARN / COMMUNITY',
    title: 'Peer learning lab',
    description: 'An example listing for a collaborative learning session.',
    when: 'Sample date / Dec 05',
    where: 'Sample venue / Learning commons',
  },
  {
    id: 'sample-project-showcase',
    category: 'SHARE / PROJECTS',
    title: 'Project showcase',
    description: 'A sample campus gathering to share work in progress.',
    when: 'Sample date / Dec 12',
    where: 'Sample venue / UGSOT studio',
  },
];

export const noticeboardAchievementSamples: readonly NoticeboardAchievementSample[] = [
  {
    id: 'sample-project',
    category: 'PROJECTS',
    title: 'A project shared',
    description: 'Example recognition for making student work visible to the community.',
  },
  {
    id: 'sample-community',
    category: 'COMMUNITY',
    title: 'A peer helped',
    description: 'Example recognition for answering a question and helping someone move forward.',
  },
  {
    id: 'sample-mentorship',
    category: 'MENTORSHIP',
    title: 'Knowledge passed on',
    description: 'Example recognition for sharing experience with another student.',
  },
];
