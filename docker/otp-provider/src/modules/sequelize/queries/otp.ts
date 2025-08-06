import { QueryOptions, Transaction } from 'sequelize';
import models from '../models';
import { config } from '../../../config';
import sequelize from '../config';
import { v4 as UUIDV4 } from 'uuid';

const { OTP_VALIDITY_MINUTES, OTP_ATTEMPTS_ALLOWED } = config;

const otpModel = models.get('Otp');

type OtpType = {
  otp?: string;
  email: string;
  clientId: string;
  attempts?: number;
  active?: boolean;
};

export const createOtp = async (otp: OtpType, transaction?: Transaction) => {
  return await otpModel.create(
    {
      id: UUIDV4(),
      otp: otp.otp,
      email: otp.email,
      clientId: otp.clientId,
    },
    {
      transaction,
    },
  );
};

export const updateOtpAttempts = async (otp: OtpType, transaction?: Transaction) => {
  await otpModel.update(
    {
      attempts: otp.attempts,
      updatedAt: new Date(),
    },
    {
      where: { otp: otp.otp, email: otp.email, clientId: otp.clientId },
    },
    {
      transaction,
    },
  );
};

export const disableActiveOtp = async (otp: OtpType, transaction?: Transaction) => {
  await otpModel.update(
    {
      active: false,
      updatedAt: new Date(),
    },
    {
      where: { email: otp.email, clientId: otp.clientId },
    },
    {
      transaction,
    },
  );
};

export const deleteOtpsByEmail = async (otp: OtpType, transaction?: Transaction) => {
  await otpModel.destroy({
    where: { email: otp.email, clientId: otp.clientId },
  });
};

export const getActiveOtp = async (otp: OtpType, options: QueryOptions = { raw: true }) => {
  return await otpModel.findOne({
    where: {
      email: otp.email,
      active: true,
      clientId: otp.clientId,
    },
    ...options,
  });
};

export const getOtpCountAndRecentDate = (email: string, clientId: string) => {
  return otpModel.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'otpCount'],
      [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastCreatedAt'],
    ],
    where: {
      email,
      clientId,
    },
    raw: true,
  });
};
