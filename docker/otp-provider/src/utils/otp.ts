import { listAllOtpsByEmail } from '../modules/sequelize/queries/otp';
import { config } from '../config';
import { errors } from '../modules/errors';

const { OTP_RESENDS_ALLOWED_PER_DAY, OTP_RESEND_INTERVAL_MINUTES } = config;

export const canRequestOtp = async (email: string) => {
  const existingOtps = await listAllOtpsByEmail(email);
  if (existingOtps.length === Number(OTP_RESENDS_ALLOWED_PER_DAY) + 1) return false;
  return true;
};

export const secondsRemainingToRequestNewOtp = async (email: string) => {
  let error = '';
  if (Number(OTP_RESENDS_ALLOWED_PER_DAY) !== JSON.parse(OTP_RESEND_INTERVAL_MINUTES).length) {
    throw new Error('OTP_RESENDS_ALLOWED_PER_DAY must match the length of OTP_RESEND_INTERVAL_MINUTES');
  }
  const existingOtps = await listAllOtpsByEmail(email);
  if (existingOtps.length === 0) return [0, null];
  if (existingOtps.length > Number(OTP_RESENDS_ALLOWED_PER_DAY)) {
    return [0, errors.OTPS_LIMIT_REACHED];
  }
  const now: Date = new Date();
  const then: Date = new Date(existingOtps[0].createdAt);
  const secondsPassedFromRecentOtp = Math.floor((now.getTime() - then.getTime()) / 1000);
  const secs = Math.max(
    0,
    JSON.parse(OTP_RESEND_INTERVAL_MINUTES)[existingOtps.length - 1] * 60 - secondsPassedFromRecentOtp,
  );
  return [secs, null];
};
