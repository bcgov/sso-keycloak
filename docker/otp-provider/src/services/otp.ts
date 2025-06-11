import { sendEmail } from '../mailer';
import {
  createOtp,
  deleteOtpsByEmail,
  disableOtpsByEmail,
  getActiveOtp,
  updateOtpAttempts,
} from '../modules/sequelize/queries/otp';
import { generateOtp } from '../utils/helpers';
import { canRequestOtp, secondsRemainingToRequestNewOtp } from '../utils/otp';
import { config } from '../config';

const { OTP_VALIDITY_MINUTES, OTP_ATTEMPTS_ALLOWED } = config;

export const requestNewOtp = async (email: string) => {
  let _error = '';
  const requestOtp = await canRequestOtp(email);
  const waitTimeforOtp = await secondsRemainingToRequestNewOtp(email);
  if (requestOtp) {
    if (waitTimeforOtp === 0) {
      await disableOtpsByEmail(email);
      const otp = generateOtp();
      await createOtp(otp, email);
      await sendEmail({
        to: [email],
        body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        subject: 'Your One-Time Password (OTP)',
      });
    } else _error = `You can request a new OTP in ${waitTimeforOtp} seconds.`;
  } else _error = 'You have reached the maximum number of OTP requests for today. Please try again tomorrow.';
  return _error;
};

export const validateOtp = async (otp: string, email: string) => {
  const activeOtp = await getActiveOtp(email);
  const otpExpired =
    new Date().getTime() - new Date(activeOtp.createdAt).getTime() > Number(OTP_VALIDITY_MINUTES) * 60 * 1000;
  if (!activeOtp || activeOtp.otp !== otp || activeOtp.attempts > Number(OTP_ATTEMPTS_ALLOWED) || otpExpired) {
    await updateOtpAttempts(activeOtp.otp, email, activeOtp.attempts + 1);
    return { verified: false, attemptsLeft: Number(OTP_ATTEMPTS_ALLOWED) - (activeOtp.attempts + 1) };
  }
  await deleteOtpsByEmail(email);
  return { verified: true, attemptsLeft: Number(OTP_ATTEMPTS_ALLOWED) - (activeOtp.attempts + 1) };
};
