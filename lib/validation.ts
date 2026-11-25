export type AuthErrors = Record<string, string>;

type SignInValues = { email: string; password: string };
type SignUpValues = SignInValues & {
  name: string;
  confirmPassword: string;
  courseYear: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string, errors: AuthErrors) {
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
}

function validatePassword(password: string, errors: AuthErrors) {
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
}

export function validateSignIn(values: SignInValues): AuthErrors {
  const errors: AuthErrors = {};
  validateEmail(values.email, errors);
  validatePassword(values.password, errors);
  return errors;
}

export function validateSignUp(values: SignUpValues): AuthErrors {
  const errors: AuthErrors = {};
  if (!values.name.trim()) errors.name = 'Enter your full name.';
  validateEmail(values.email, errors);
  validatePassword(values.password, errors);
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  if (!values.courseYear) errors.courseYear = 'Choose your course and year.';
  return errors;
}

export function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null
    && Object.values(value).every((item) => typeof item === 'string');
}
