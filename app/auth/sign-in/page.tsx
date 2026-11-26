import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Sign in · CampusHub · UGSOT' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (await getCurrentUser()) redirect('/');
  const resolved = searchParams ? await searchParams : {};
  const initialError = typeof resolved.error === 'string' ? resolved.error : undefined;

  return (
    <div className="auth-content">
      <AuthForm mode="sign-in" initialError={initialError} />
      <div className="auth-links">
        <Link href="/" className="auth-guest">Continue as guest</Link>
      </div>
    </div>
  );
}
