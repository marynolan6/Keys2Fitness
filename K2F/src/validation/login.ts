export type LoginFields = {
  email: string;
  password: string;
};

export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Email is required.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateLogin(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  const email = validateEmail(fields.email);
  const password = validatePassword(fields.password);
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}
