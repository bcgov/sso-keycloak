import { errors } from '../modules/errors';

export const emailValidator = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return errors.EMAIL_REQUIRED;
  } else if (email.length > 254 || !emailRegex.test(email)) {
    return errors.INVALID_EMAIL;
  }
  return '';
};
