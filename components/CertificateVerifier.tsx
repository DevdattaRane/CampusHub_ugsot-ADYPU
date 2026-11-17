'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { VerifiedCertificate } from '@/lib/db/events';

type Props = {
  initialId?: string;
  initialResult?: VerifiedCertificate | null;
};

export default function CertificateVerifier({ initialId = '', initialResult = null }: Props) {
  const [certId, setCertId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedCertificate | null>(initialResult);
  const [searched, setSearched] = useState(Boolean(initialId));
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = certId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`/api/certificates/verify?id=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify certificate');
      }

      setResult(data.certificate ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error validating certificate');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form onSubmit={handleVerify} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label htmlFor="certificate-id-input" style={{ fontWeight: 700, fontSize: 16 }}>
          Enter Certificate ID:
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            id="certificate-id-input"
            type="text"
            className="input"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            style={{ flex: '1 1 280px', fontFamily: 'monospace', fontSize: 14 }}
            required
          />
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </form>

      {/* Verification Result */}
      {searched && !loading && (
        <>
          {result && result.isValid ? (
            <div
              className="card"
              style={{
                padding: 28,
                border: '3px solid #16a34a',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: '#15803d' }}>
                    Authentic Certificate Verified
                  </h2>
                  <span style={{ fontSize: 13, color: '#166534' }}>
                    Issued by CampusHub · UGSOT ADYPU
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14,
                  borderTop: '1px solid #bbf7d0',
                  paddingTop: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>RECIPIENT</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{result.attendeeName}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>EVENT</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{result.eventTitle}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>ISSUED ON</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {new Date(result.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>STATUS</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>
                    ✓ Valid & Confirmed Present
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <Link href={`/certificates/${result.certificateId}`} className="btn btn--primary">
                  View Full Printable Certificate →
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: 24,
                border: '3px solid #dc2626',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>❌</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#b91c1c' }}>
                  No Valid Certificate Found
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#7f1d1d' }}>
                  {error || 'This certificate ID could not be verified. Please double-check the ID or contact event organizers.'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
