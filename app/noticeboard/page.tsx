import type { Metadata } from 'next';
import Noticeboard from '@/components/noticeboard/Noticeboard';

export const metadata: Metadata = {
  title: 'Noticeboard · CampusHub · UGSOT',
  description: 'A public preview of campus events and community achievements at UGSOT ADYPU.',
};

export default function NoticeboardPage() {
  return <Noticeboard />;
}
