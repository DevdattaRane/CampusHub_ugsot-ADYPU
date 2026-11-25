import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign in · CampusHub · UGSOT' };

export default function SignInPage() {
  return (
    <div className="auth-content">
      <AuthForm mode="sign-in" />
      <div className="auth-links">
        <Link href="/" className="auth-guest">Continue as guest</Link>
      </div>
    </div>
  );
}
