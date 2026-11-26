export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'organizer';
  githubUsername?: string | null;
  skills?: string[];
  bio?: string | null;
  courseYear?: string | null;
  interests?: string[];
  goals?: string[];
  onboardingCompleted?: boolean;
  isProfilePrivate?: boolean;
  isSuspended?: boolean;
  warningCount?: number;
};

export class AuthServiceError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthServiceError';
  }
}

export function getPublicOrigin(request?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    const host = request.headers.get('host');
    if (host) {
      const proto = host.includes('localhost') ? 'http' : 'https';
      return `${proto}://${host}`;
    }
    try {
      return new URL(request.url).origin;
    } catch {
      // ignore
    }
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
