import Link from 'next/link';
import { verifyCertificate } from '@/lib/db/events';
import PrintCertificateButton from '@/components/PrintCertificateButton';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const cert = await verifyCertificate(id);
  return {
    title: cert ? `Certificate · ${cert.attendeeName} · ${cert.eventTitle}` : 'Certificate · CampusHub',
  };
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const cert = await verifyCertificate(id);

  if (!cert) {
    return (
      <main className="container page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: 32 }}>Certificate Not Found</h1>
        <p style={{ margin: '16px 0 24px', opacity: 0.8 }}>
          The certificate ID <code>{id}</code> does not match any verified certificates in our system.
        </p>
        <Link href="/verify" className="btn btn--primary">
          Verify Another Certificate
        </Link>
      </main>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="container page certificate-view-page" style={{ padding: '20px 0 60px' }}>
      {/* Non-printed action bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Link href="/profile" className="back-link">
          ← Back to profile
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/verify?id=${cert.certificateId}`} className="btn btn--ghost" style={{ fontSize: 13 }}>
            🔍 Verify Record
          </Link>
          <PrintCertificateButton />
        </div>
      </div>

      {/* Printable Certificate Frame */}
      <div
        className="certificate-frame"
        style={{
          background: '#ffffff',
          color: '#1a1a1a',
          border: '8px double #1a1a1a',
          borderRadius: 8,
          padding: 'clamp(28px, 6vw, 64px)',
          textAlign: 'center',
          boxShadow: '8px 8px 0 #1a1a1a',
          maxWidth: 820,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Corner Accents */}
        <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 14, fontWeight: 800, letterSpacing: '0.1em' }}>
          CAMPUSHUB · UGSOT
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
          ✓ VERIFIED ATTENDANCE
        </div>

        <div style={{ marginTop: 24, marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-block',
              background: '#fef08a',
              border: '2px solid #1a1a1a',
              padding: '4px 14px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            Certificate of Participation
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            margin: '16px 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}
        >
          {cert.attendeeName}
        </h1>

        <p style={{ fontSize: 16, color: '#4b5563', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.6 }}>
          has successfully attended and participated in
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 'clamp(22px, 4vw, 32px)',
            color: '#2563eb',
            fontWeight: 800,
            margin: '0 0 16px',
          }}
        >
          {cert.eventTitle}
        </h2>

        <p style={{ fontSize: 15, color: '#374151', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.5 }}>
          organized by the School of Technology, Ajeenkya DY Patil University (UGSOT ADYPU).
        </p>

        {/* Certificate Metadata / Footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 20,
            borderTop: '2px dashed #1a1a1a',
            paddingTop: 24,
            marginTop: 20,
            textAlign: 'left',
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>
              Date Issued
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{issuedDate}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>
              Certificate ID
            </div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
              {cert.certificateId}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, color: '#6b7280' }}>
              Verified By
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
              CampusHub System
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, nav, header, footer, .bottom-nav, .site-header {
            display: none !important;
          }
          .certificate-frame {
            box-shadow: none !important;
            border: 4px solid black !important;
            margin: 0 !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
