export type NoticeboardAchievementSample = {
  id: string;
  category: string;
  title: string;
  description: string;
};

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
