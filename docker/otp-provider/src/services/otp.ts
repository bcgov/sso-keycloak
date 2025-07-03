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
    const waitTimeforOtp = await secondsRemainingToRequestNewOtp(email);
    if (waitTimeforOtp === 0) {
      await disableOtpsByEmail(email);
      const otp = generateOtp();
      await createOtp(otp, email);
      await sendEmail({
        to: [email],
        body: `<p>Copy and enter this 6-digit verification code to the One Time Passcode login page. This code will expire in 5 minutes.</p>
        <p style="font-size:24px;"><strong>${otp}</strong></p>
        <p>Do not share this code or forward this email to anyone.</p>
        <p>If this wasn't you, please ignore this message.</p>
        <p>This is an automated message from the Government of British Columbia. Please do not reply.</p>
        `,
        subject: `${otp} is your verification code.`,
      });
    }
  }
};

const FIVE_MINUTES = 5*60*1000;

export const validateOtp = async (otp: string, email: string) => {
  const activeOtp = await getActiveOtp(email);
  if (!activeOtp) {
    return { verified: false, attemptsLeft: 0, expired: false };
  } else if (Date.now() - new Date(activeOtp.createdAt).getTime() > FIVE_MINUTES) {
    return {verified: false, attemptsLeft: 0, expired: true }
  } else if (activeOtp.otp !== otp) {
    if (activeOtp.attempts < Number(OTP_ATTEMPTS_ALLOWED))
      await updateOtpAttempts(activeOtp.otp, email, activeOtp.attempts + 1);
    return { verified: false, attemptsLeft: Number(OTP_ATTEMPTS_ALLOWED) - (activeOtp.attempts + 1), expired: false, };
  }
  await deleteOtpsByEmail(email);
  return { verified: true, attemptsLeft: Number(OTP_ATTEMPTS_ALLOWED) - (activeOtp.attempts + 1), expired: false };
};
