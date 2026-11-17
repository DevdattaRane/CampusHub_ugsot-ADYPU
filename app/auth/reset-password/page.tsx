import Link from 'next/link';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Set new password · CampusHub · UGSOT' };

export default function ResetPasswordPage() {
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
