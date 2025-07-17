import { config } from '../config';
import { ErrorKeys, errors } from '../modules/errors';
import { generateOtp } from '../utils/helpers';
import sequelize from '../modules/sequelize/config';

const { OTP_RESEND_INTERVAL_MINUTES, OTP_ATTEMPTS_ALLOWED } = config;

/**
 *
 * @param email
 * @param delayMultiplier Optional parameter setting the seconds per minute to wait on code resends. Can be reduced in test and local environments to avoid long delays. E.g. set to 1 in test workflows to delay in seconds and not minutes.
 */
export const requestOtp = async (email: string, clientID: string, delayMultiplier: number = 60) => {
  const newOtp = generateOtp();
  const result = (await sequelize.query('select * from generate_otp_with_delays(?,?,?,?,?)', {
    replacements: [email, OTP_RESEND_INTERVAL_MINUTES, newOtp, clientID, delayMultiplier],
  })) as [{ code: string; wait_time: number; error: ErrorKeys | null }[], unknown];
  const { wait_time: waitTime, error } = result[0][0];
  return { waitTime, error, newOtp };
};

export const getOtpWaitTime = async (email: string, delayMultiplier: number = 60) => {
  const waitTimeResponse = (await sequelize.query(`select * from get_otp_wait_time(?,?,?)`, {
    replacements: [email, OTP_RESEND_INTERVAL_MINUTES, delayMultiplier],
  })) as [{ can_request: boolean; wait_seconds: number; otp_count: number }[], unknown];
  return waitTimeResponse[0][0].wait_seconds;
};

export const verifyOtp = async (email: string, otp: string, clientID: string, delayMultiplier: number = 60) => {
  const queryResult = (await sequelize.query('select * from validate_otp(?,?,?,?,?,?)', {
    replacements: [email, otp, clientID, OTP_ATTEMPTS_ALLOWED, OTP_RESEND_INTERVAL_MINUTES, delayMultiplier],
  })) as [{ success: boolean; wait_time: number; error: ErrorKeys | null }, unknown][];

  const {  wait_time: waitTime, error } = queryResult[0][0];
  return {waitTime, error}
};
