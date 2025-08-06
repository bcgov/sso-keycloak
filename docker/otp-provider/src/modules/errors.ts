export const errors = {
  OTPS_LIMIT_REACHED: 'You have reached the maximum number of OTP requests for today. Please try again tomorrow.',
  EMAIL_REQUIRED: 'Email is required.',
  INVALID_EMAIL: 'Invalid email.',
  EXPIRED_OTP_WITH_RESEND: `You've tried too many times. Please send a new code.`,
  INVALID_OTP: 'Invalid code entered. Please try again or send a new code.',
  // Expired OTP error has a customized view
  EXPIRED_OTP: '',
  NO_ACTIVE_OTP: '',
};

type Errors = typeof errors;
export type ErrorKeys = keyof Errors;
