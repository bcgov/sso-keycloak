import { config } from '../config';
import { ErrorKeys, errors } from '../modules/errors';
import { generateOtp } from '../utils/helpers';
import sequelize from '../modules/sequelize/config';
import {
  createOtp,
  deleteOtpsByEmail,
  disableActiveOtp,
  getActiveOtp,
  getOtpCountAndRecentDate,
  updateOtpAttempts,
} from '../modules/sequelize/queries/otp';
import { createEvent } from '../modules/sequelize/queries/event';

const { OTP_RESEND_INTERVAL_MINUTES, OTP_ATTEMPTS_ALLOWED, NODE_ENV } = config;

const otpResendIntervalMinutes = JSON.parse(OTP_RESEND_INTERVAL_MINUTES || '[]');

export const requestOtp = async (email: string, clientId: string) => {
  const transaction = await sequelize.transaction();
  let response = { waitTime: 0, error: '', newOtp: null };
  try {
    const otps = await getOtpCountAndRecentDate(email, clientId);

    if (otps[0].otpCount > otpResendIntervalMinutes.length) {
      await createEvent(
        {
          eventType: 'MAX_RESENDS',
          clientId,
          email,
        },
        transaction,
      );
      response.error = 'OTPS_LIMIT_REACHED';
    } else if (otps[0].otpCount === '0') {
      await createEvent(
        {
          eventType: 'REQUEST_OTP',
          clientId,
          email,
        },
        transaction,
      );

      const otp = await createOtp({ otp: generateOtp(), email, clientId }, transaction);
      response.newOtp = otp.otp;
    } else {
      const currentWaitSeconds = await getOtpWaitTime(email, clientId);
      if (currentWaitSeconds === 0) {
        await createEvent(
          {
            eventType: 'RESEND_OTP',
            clientId,
            email,
          },
          transaction,
        );
        await disableActiveOtp({ email, clientId }, transaction);
        const otp = await createOtp({ otp: generateOtp(), email, clientId }, transaction);
        response.newOtp = otp.otp;
      } else {
        response = { ...response, waitTime: currentWaitSeconds, error: 'RESEND_TIMEOUT' };
      }
    }
    await transaction.commit();
    if (!response.error) response.waitTime = await getOtpWaitTime(email, clientId);
    return response;
  } catch (err) {
    transaction.rollback();
    console.error(err);
    throw new Error('Failed to create OTP');
  }
};

//delayMultiplier: seconds per minute to wait on code resends. Can be reduced in test and local environments to avoid long delays. E.g. set to 1 in test workflows to delay in seconds and not minutes.
export const getOtpWaitTime = async (email: string, clientId: string) => {
  const delayMultiplier = NODE_ENV === 'test' ? 2 : 60;

  const otps = await getOtpCountAndRecentDate(email, clientId);

  if (otps[0].otpCount === 0) return parseInt(otpResendIntervalMinutes[0]) * delayMultiplier;
  else if (otps[0].otpCount > otpResendIntervalMinutes.length) return -1;

  const secondsElapsedSinceLastRequest = Math.ceil(
    (new Date().getTime() - new Date(otps[0].lastCreatedAt).getTime()) / 1000,
  );

  return Math.max(
    parseInt(otpResendIntervalMinutes[otps[0].otpCount - 1]) * delayMultiplier - secondsElapsedSinceLastRequest,
    0,
  );
};

export const verifyOtp = async (email: string, otp: string, clientId: string) => {
  let response = { waitTime: 0, error: '' };
  const transaction = await sequelize.transaction();
  try {
    let activeOtp = await getActiveOtp({ email, clientId });
    if (process.env.TEST_MODE === 'true') {
      activeOtp =
      {
        id: '1',
        otp: '111111',
        email,
        attempts: 0,
        active: true,
      };
    }
    if (!activeOtp) {
      await createEvent(
        {
          eventType: 'NO_ACTIVE_OTP',
          clientId,
          email,
        },
        transaction,
      );

      response.error = 'NO_ACTIVE_OTP';
    } else {
      if (activeOtp.attempts >= OTP_ATTEMPTS_ALLOWED) {
        ['INVALID_OTP', 'MAX_ATTEMPTS'].forEach(async (eventType) => {
          await createEvent(
            {
              eventType,
              clientId,
              email,
            },
            transaction,
          );
        });

        response.waitTime = await getOtpWaitTime(email, clientId);
        response.error = 'EXPIRED_OTP_WITH_RESEND';
      } else if (activeOtp.otp !== otp) {
        await updateOtpAttempts({ otp: activeOtp.otp, email, clientId, attempts: activeOtp.attempts + 1 }, transaction);
        await createEvent(
          {
            eventType: 'INVALID_OTP',
            clientId,
            email,
          },
          transaction,
        );
        response.waitTime = await getOtpWaitTime(email, clientId);
        response.error = 'INVALID_OTP';
      } else if (
        new Date(activeOtp.createdAt).getTime() + parseInt(config.OTP_VALIDITY_MINUTES) * 60 * 1000 <
        new Date().getTime()
      ) {
        await createEvent(
          {
            eventType: 'EXPIRED_OTP',
            clientId,
            email,
          },
          transaction,
        );
        response.waitTime = await getOtpWaitTime(email, clientId);
        response.error = 'EXPIRED_OTP';
      } else {
        await deleteOtpsByEmail({ email, clientId }, transaction);

        await createEvent(
          {
            eventType: 'OTP_VERIFIED',
            clientId,
            email,
          },
          transaction,
        );
      }
    }
    await transaction.commit();
    return response;
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    throw new Error('Failed to verify OTP');
  }
};
