import Link from 'next/link';
import { redirect } from 'next/navigation';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Forgot password · CampusHub · UGSOT' };

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <div className="auth-content">
      <div className="auth-heading">
        <h1 className="auth-heading__title">Reset your password</h1>
        <p>Enter your email address and we’ll help you regain access to your account.</p>
      </div>
      <ForgotPasswordForm />
      <div className="auth-links">
        <Link href="/auth/sign-in" className="auth-guest">← Back to sign in</Link>
      </div>
    </div>
  );
}
