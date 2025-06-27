/*
    Use this file only for shared code between the client and server, e.g form errors or form validations. Imported libs here will be bundled to the client.
*/

export const otpValidDigits = ['1','2','3','4','5','6','7','8','9','0'];

export const errors = {
  OTPS_LIMIT_REACHED: 'You have reached the maximum number of OTP requests for today. Please try again tomorrow.',
  EMAIL_REQUIRED: 'Email is required.',
  INVALID_EMAIL: 'Invalid email.',
  EXPIRED_OTP_WITH_RESEND: 'Your OTP has expired. Please request a new one to continue.',
  OTP_LENGTH: 'Please provide 6 digits.',
  OTP_TYPES: 'OTP Must only include digits [0-9].'
};

export const emailValidator = (email?: string): [boolean, null | string] => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    return [false, errors.EMAIL_REQUIRED];
  } else if (email.length > 254 || !emailRegex.test(email)) {
    return [false, errors.INVALID_EMAIL];
  }
  return [true, null];
};

export const otpValidator = (codes: any[]) => {
    if (codes.length !== 6) return [false, errors.OTP_LENGTH];
    if (!codes.every(codePart => otpValidDigits.includes(codePart))) return [false, errors.OTP_TYPES];
    return [codes.join(''), null];
}
