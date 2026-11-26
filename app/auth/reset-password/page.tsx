import Link from 'next/link';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Set new password · CampusHub · UGSOT' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const errorMessage = typeof resolvedParams.error === 'string' ? resolvedParams.error : undefined;
  const currentUser = await getCurrentUser();

  if (errorMessage) {
    return (
      <div className="auth-content">
        <div className="auth-heading">
          <h1 className="auth-heading__title">Reset link error</h1>
          <p>We couldn’t verify your password reset link.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="form-error" role="alert" style={{ margin: 0 }}>
            {errorMessage}
          </p>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            Password reset links are valid for one use and expire after a short period. Please request a fresh reset link to continue.
          </p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Link href="/auth/forgot-password" className="btn btn--primary">
              Request new reset link
            </Link>
            <Link href="/auth/sign-in" className="btn btn--outline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="auth-content">
        <div className="auth-heading">
          <h1 className="auth-heading__title">Reset link required</h1>
          <p>To set a new password, you must use the recovery link sent to your email.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            If you requested a password reset, please click the link in your email. If that link has expired or has already been used, you can request a new one below.
          </p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Link href="/auth/forgot-password" className="btn btn--primary">
              Request password reset
            </Link>
            <Link href="/auth/sign-in" className="btn btn--outline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-content">
      <div className="auth-heading">
        <h1 className="auth-heading__title">Create a new password</h1>
        <p>Enter your new password below to secure your CampusHub account.</p>
      </div>
      <ResetPasswordForm />
      <div className="auth-links">
        <Link href="/auth/sign-in" className="auth-guest">← Back to sign in</Link>
      </div>
    </div>
  );
}
