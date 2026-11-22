import type { Metadata } from 'next';
import Noticeboard from '@/components/noticeboard/Noticeboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Noticeboard · CampusHub · UGSOT',
  description: 'Organizer-published campus events and illustrative community achievement previews at UGSOT ADYPU.',
};

export default function NoticeboardPage() {
  return <Noticeboard />;
}
