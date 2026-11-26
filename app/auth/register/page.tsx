import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Create account · CampusHub · UGSOT' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <div className="auth-content">
      <AuthForm mode="register" />
      <div className="auth-links">
        <Link href="/" className="auth-guest">Continue as guest</Link>
      </div>
    </div>
  );
}
