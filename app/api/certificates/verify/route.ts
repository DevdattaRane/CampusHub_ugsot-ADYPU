import { NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/db/events';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !id.trim()) {
    return NextResponse.json({ error: 'Certificate ID is required.' }, { status: 400 });
  }

  try {
    const cert = await verifyCertificate(id.trim());
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found or invalid.' }, { status: 404 });
    }
    return NextResponse.json({ certificate: cert });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({ error: 'Failed to verify certificate.' }, { status: 500 });
  }
}
