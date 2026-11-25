import PageHero from '@/components/PageHero';
import CertificateVerifier from '@/components/CertificateVerifier';
import { verifyCertificate } from '@/lib/db/events';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Verify Certificate · CampusHub · UGSOT',
  description: 'Verify official CampusHub certificates of participation and achievement.',
};

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function VerifyPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const initialResult = id ? await verifyCertificate(id) : null;

  return (
    <main className="container page verify-page">
      <PageHero
        tag="Security & Verification"
        before="Official "
        highlight="Certificate Verification"
        sub="Verify official attendance certificates issued by CampusHub for UGSOT ADYPU events."
      />
      <div style={{ marginTop: 24 }}>
        <CertificateVerifier initialId={id || ''} initialResult={initialResult} />
      </div>
    </main>
  );
}
