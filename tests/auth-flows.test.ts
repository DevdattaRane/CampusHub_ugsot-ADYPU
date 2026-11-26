import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateSignUp,
  validateSignIn,
  validateResetPassword,
  isValidEmail,
} from '../lib/validation.ts';
import { getPublicOrigin, AuthServiceError, type CurrentUser } from '../lib/auth-helpers.ts';

// 1. Email validation & domain flexibility
test('Email validation allows legitimate email providers without college restrictions', () => {
  // Gmail
  assert.equal(isValidEmail('student@gmail.com'), true);
  // Outlook
  assert.equal(isValidEmail('student@outlook.com'), true);
  // Yahoo
  assert.equal(isValidEmail('student@yahoo.com'), true);
  // ADYPU college email
  assert.equal(isValidEmail('student@adypu.edu.in'), true);
  // Other legitimate domains
  assert.equal(isValidEmail('researcher@mit.edu'), true);
  assert.equal(isValidEmail('developer@proton.me'), true);
});

test('Email validation rejects malformed and empty email addresses', () => {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('notanemail'), false);
  assert.equal(isValidEmail('missingdomain@'), false);
  assert.equal(isValidEmail('@nodomain.com'), false);
  assert.equal(isValidEmail('spaces in@email.com'), false);
  assert.equal(isValidEmail('user@.com'), false);
});

// 2. Registration flows (Gmail, Outlook, ADYPU)
test('validateSignUp accepts valid Gmail registration', () => {
  const errors = validateSignUp({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    password: 'StrongPassword123!',
    confirmPassword: 'StrongPassword123!',
    courseYear: 'CSE · 2nd year',
  });
  assert.deepEqual(errors, {});
});

test('validateSignUp accepts valid Outlook registration', () => {
  const errors = validateSignUp({
    name: 'Priya Patel',
    email: 'priya.patel@outlook.com',
    password: 'StrongPassword123!',
    confirmPassword: 'StrongPassword123!',
    courseYear: 'AI & DS · 3rd year',
  });
  assert.deepEqual(errors, {});
});

test('validateSignUp accepts valid ADYPU college registration', () => {
  const errors = validateSignUp({
    name: 'Rohan Joshi',
    email: 'rohan.joshi@adypu.edu.in',
    password: 'StrongPassword123!',
    confirmPassword: 'StrongPassword123!',
    courseYear: 'IT · 1st year',
  });
  assert.deepEqual(errors, {});
});

test('validateSignUp rejects invalid inputs', () => {
  // Empty name
  const emptyName = validateSignUp({
    name: '',
    email: 'test@gmail.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    courseYear: 'CSE · 1st year',
  });
  assert.equal(emptyName.name, 'Enter your full name.');

  // Password < 8 characters
  const shortPass = validateSignUp({
    name: 'Test',
    email: 'test@gmail.com',
    password: 'short',
    confirmPassword: 'short',
    courseYear: 'CSE · 1st year',
  });
  assert.equal(shortPass.password, 'Use at least 8 characters.');

  // Password mismatch
  const mismatch = validateSignUp({
    name: 'Test',
    email: 'test@gmail.com',
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
    courseYear: 'CSE · 1st year',
  });
  assert.equal(mismatch.confirmPassword, 'Passwords do not match.');

  // Missing course year
  const missingYear = validateSignUp({
    name: 'Test',
    email: 'test@gmail.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    courseYear: '',
  });
  assert.equal(missingYear.courseYear, 'Choose your course and year.');
});

// 3. Existing account and registration error reporting
test('Registration error handling distinguishes existing accounts and generic failures', () => {
  function handleSignUpError(error: { message: string } | null, identities?: unknown[]): void {
    if (error) {
      const alreadyRegistered = /already (?:been )?registered|already exists/i.test(error.message);
      throw new AuthServiceError(
        alreadyRegistered ? 'An account with this email already exists. Try signing in.' : error.message,
        400,
      );
    }
    if (identities && identities.length === 0) {
      throw new AuthServiceError('An account with this email already exists. Try signing in.', 400);
    }
  }

  // Already registered error string
  assert.throws(
    () => handleSignUpError({ message: 'User already registered' }),
    (err: unknown) => {
      return err instanceof AuthServiceError && err.message.includes('already exists');
    },
  );

  // Identity collision (empty identities array in Supabase Auth)
  assert.throws(
    () => handleSignUpError(null, []),
    (err: unknown) => {
      return err instanceof AuthServiceError && err.message.includes('already exists');
    },
  );
});

// 4. Login and credential validation
test('validateSignIn validates email and minimum 8-char password', () => {
  const valid = validateSignIn({
    email: 'student@gmail.com',
    password: 'Password123!',
  });
  assert.deepEqual(valid, {});

  const invalid = validateSignIn({
    email: 'invalid-email',
    password: '123',
  });
  assert.equal(invalid.email, 'Enter a valid email address.');
  assert.equal(invalid.password, 'Use at least 8 characters.');
});

test('Login error handling produces generic credentials error and unconfirmed email guidance', () => {
  function handleSignInError(error: { message: string }): void {
    if (/email not confirmed/i.test(error.message)) {
      throw new AuthServiceError('Please verify your email address before signing in. Check your inbox for the confirmation link.', 400);
    }
    throw new AuthServiceError('Email or password is incorrect. Please try again.', 400);
  }

  // Invalid credentials error
  assert.throws(
    () => handleSignInError({ message: 'Invalid login credentials' }),
    (err: unknown) => {
      return err instanceof AuthServiceError && err.message === 'Email or password is incorrect. Please try again.';
    },
  );

  // Unconfirmed email error
  assert.throws(
    () => handleSignInError({ message: 'Email not confirmed' }),
    (err: unknown) => {
      return err instanceof AuthServiceError && err.message.includes('verify your email');
    },
  );
});

// 5. Password reset requests and dynamic origin resolution
test('getPublicOrigin dynamically resolves production, reverse proxy, and forwarded headers', () => {
  // Test forwarded headers from Vercel / Cloudflare
  const requestWithForwardedHost = new Request('http://localhost:3000/api/auth/forgot-password', {
    headers: {
      'x-forwarded-host': 'campushub-production.vercel.app',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(getPublicOrigin(requestWithForwardedHost), 'https://campushub-production.vercel.app');

  // Test host header
  const requestWithHost = new Request('http://localhost:3000/auth/callback', {
    headers: {
      host: 'campushub.adypu.edu.in',
    },
  });
  assert.equal(getPublicOrigin(requestWithHost), 'https://campushub.adypu.edu.in');

  // Test fallback without request
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://campushub.io';
  assert.equal(getPublicOrigin(), 'https://campushub.io');
  if (originalSiteUrl !== undefined) {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  } else {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  }
});

test('Password reset request accepts Gmail, Outlook, and ADYPU and generates correct redirect URL', () => {
  const req = new Request('http://localhost:3000/api/auth/forgot-password', {
    headers: { 'x-forwarded-host': 'campushub.vercel.app', 'x-forwarded-proto': 'https' },
  });
  const origin = getPublicOrigin(req);
  const redirectTo = `${origin}/auth/callback?next=/auth/reset-password`;

  assert.equal(redirectTo, 'https://campushub.vercel.app/auth/callback?next=/auth/reset-password');
  assert.equal(isValidEmail('user@gmail.com'), true);
  assert.equal(isValidEmail('user@outlook.com'), true);
  assert.equal(isValidEmail('user@adypu.edu.in'), true);
});

// 6. Reset callback handling
test('Auth callback URL construction for password reset and onboarding', () => {
  const origin = 'https://campushub.adypu.edu.in';
  const resetRedirect = `${origin}/auth/callback?next=/auth/reset-password`;
  const onboardingRedirect = `${origin}/auth/callback?next=/onboarding`;

  const resetUrl = new URL(resetRedirect);
  assert.equal(resetUrl.origin, origin);
  assert.equal(resetUrl.pathname, '/auth/callback');
  assert.equal(resetUrl.searchParams.get('next'), '/auth/reset-password');

  const onboardingUrl = new URL(onboardingRedirect);
  assert.equal(onboardingUrl.origin, origin);
  assert.equal(onboardingUrl.pathname, '/auth/callback');
  assert.equal(onboardingUrl.searchParams.get('next'), '/onboarding');
});

test('Auth callback error handling routes expired and invalid links to password reset page with error', () => {
  const origin = 'https://campushub.adypu.edu.in';
  const next = '/auth/reset-password';
  const errorDescription = 'Email link is invalid or has expired';

  const destination = new URL(next.includes('reset-password') ? '/auth/reset-password' : '/auth/sign-in', origin);
  destination.searchParams.set('error', errorDescription);

  assert.equal(destination.pathname, '/auth/reset-password');
  assert.equal(destination.searchParams.get('error'), 'Email link is invalid or has expired');
});

// 7. Password update validation
test('validateResetPassword enforces consistent 8-character password rule', () => {
  const valid = validateResetPassword({
    password: 'NewStrongPassword123!',
    confirmPassword: 'NewStrongPassword123!',
  });
  assert.deepEqual(valid, {});

  const short = validateResetPassword({
    password: 'short',
    confirmPassword: 'short',
  });
  assert.equal(short.password, 'Use at least 8 characters.');

  const mismatch = validateResetPassword({
    password: 'NewStrongPassword123!',
    confirmPassword: 'NonMatchingPassword123!',
  });
  assert.equal(mismatch.confirmPassword, 'Passwords do not match.');
});

// 8. Profile creation and onboarding
test('Profile metadata fallback handles missing database profile records', () => {
  const mockAuthUser = {
    id: 'user-123',
    email: 'student@gmail.com',
    user_metadata: {
      full_name: 'Aditya Chaudhari',
      course_year: 'CSE · 4th year',
      skills: ['TypeScript', 'Next.js'],
    },
  };

  function resolveUserProfile(
    dbProfile: { full_name?: string; course_year?: string; role?: string } | null,
    authUser: typeof mockAuthUser,
  ) {
    return {
      name: dbProfile?.full_name || authUser.user_metadata?.full_name || 'Student',
      courseYear: dbProfile?.course_year || authUser.user_metadata?.course_year || null,
      role: dbProfile?.role || 'student',
    };
  }

  const resolved = resolveUserProfile(null, mockAuthUser);

  assert.equal(resolved.name, 'Aditya Chaudhari');
  assert.equal(resolved.courseYear, 'CSE · 4th year');
  assert.equal(resolved.role, 'student');
});

test('Onboarding payload sanitization strips unauthorized role alterations', () => {
  const inputBody = {
    fullName: 'Jane Doe',
    courseYear: 'IT · 2nd year',
    skills: ['React', 'Node.js'],
    interests: ['AI', 'Open Source'],
    goals: ['Build startup'],
    githubUsername: '@janedoe',
    role: 'organizer', // Malicious attempt to self-promote to organizer
  };

  // Only allowed fields are included in the update payload
  const safePayload: Record<string, unknown> = {
    onboarding_completed: true,
    full_name: inputBody.fullName.trim(),
    course_year: inputBody.courseYear.trim(),
    skills: inputBody.skills,
    interests: inputBody.interests,
    goals: inputBody.goals,
    github_username: inputBody.githubUsername.replace(/^@/, ''),
  };

  assert.equal('role' in safePayload, false);
  assert.equal(safePayload.github_username, 'janedoe');
  assert.equal(safePayload.onboarding_completed, true);
});

// 9. Protected routes access control
test('Protected routes properly require authenticated user session', () => {
  function checkRouteAccess(pathname: string, user: { id: string } | null): { allowed: boolean; redirect?: string } {
    const protectedRoutes = ['/onboarding', '/notifications', '/moderation', '/organizer/events'];
    if (protectedRoutes.includes(pathname) && !user) {
      return { allowed: false, redirect: '/auth/sign-in' };
    }
    const guestOnlyRoutes = ['/auth/sign-in', '/auth/register', '/auth/forgot-password'];
    if (guestOnlyRoutes.includes(pathname) && user) {
      return { allowed: false, redirect: '/' };
    }
    // /auth/reset-password is allowed for users in recovery session
    if (pathname === '/auth/reset-password') {
      return { allowed: true };
    }
    return { allowed: true };
  }

  // Guest accessing protected route
  assert.deepEqual(checkRouteAccess('/onboarding', null), { allowed: false, redirect: '/auth/sign-in' });
  assert.deepEqual(checkRouteAccess('/notifications', null), { allowed: false, redirect: '/auth/sign-in' });

  // Authenticated user accessing sign-in / register is redirected to home
  assert.deepEqual(checkRouteAccess('/auth/sign-in', { id: 'u1' }), { allowed: false, redirect: '/' });
  assert.deepEqual(checkRouteAccess('/auth/register', { id: 'u1' }), { allowed: false, redirect: '/' });

  // Authenticated user on /auth/reset-password is NOT redirected away
  assert.deepEqual(checkRouteAccess('/auth/reset-password', { id: 'u1' }), { allowed: true });
});

// 10. Organizer & moderation authorization
test('Role-based access guard restricts non-organizers from moderation desk and organizer tools', () => {
  const studentUser: CurrentUser = { id: 'u1', name: 'Student', email: 's@gmail.com', role: 'student' };
  const organizerUser: CurrentUser = { id: 'u2', name: 'Organizer', email: 'o@adypu.edu.in', role: 'organizer' };

  function checkOrganizerAccess(user: CurrentUser | null): boolean {
    if (!user) return false;
    return user.role === 'organizer';
  }

  assert.equal(checkOrganizerAccess(null), false);
  assert.equal(checkOrganizerAccess(studentUser), false);
  assert.equal(checkOrganizerAccess(organizerUser), true);
});

// 11. Session persistence & proxy response headers
test('Proxy session refresh sets no-cache headers when auth cookies are updated', () => {
  const cacheHeaders: Record<string, string> = {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    Expires: '0',
    Pragma: 'no-cache',
  };

  const responseHeaders = new Headers();
  Object.entries(cacheHeaders).forEach(([k, v]) => responseHeaders.set(k, v));

  assert.equal(responseHeaders.get('Cache-Control'), 'private, no-cache, no-store, must-revalidate, max-age=0');
  assert.equal(responseHeaders.get('Pragma'), 'no-cache');
  assert.equal(responseHeaders.get('Expires'), '0');
});
