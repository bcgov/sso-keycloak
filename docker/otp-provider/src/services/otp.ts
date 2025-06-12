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
  const canRequest = await canRequestOtp(email);
  if (canRequest) {
    const [waitTimeforOtp] = await secondsRemainingToRequestNewOtp(email);
    if (waitTimeforOtp === 0) {
      await disableOtpsByEmail(email);
      const otp = generateOtp();
      await createOtp(otp, email);
      await sendEmail({
        to: [email],
        body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        subject: 'Your One-Time Password (OTP)',
      });
    }
  }
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
