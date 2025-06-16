import { Op, QueryOptions } from 'sequelize';
import models from '../models';
import { config } from '../../../config';

const { OTP_VALIDITY_MINUTES, OTP_ATTEMPTS_ALLOWED } = config;

const otpModel = models.get('Otp');

export const createOtp = async (otp: string, email: string) => {
  return await otpModel.create({
    otp,
    email,
  });
};

export const updateOtpAttempts = async (otp: string, email: string, attempts: number) => {
  await otpModel.update(
    {
      attempts,
      updatedAt: new Date(),
    },
    {
      where: { otp, email },
    },
  );
};

export const disableOtpsByEmail = async (email: string) => {
  await otpModel.update(
    {
      active: false,
      updatedAt: new Date(),
    },
    {
      where: { email },
    },
  );
};

export const deleteOtpsByEmail = async (email: string) => {
  await otpModel.destroy({
    where: { email },
  });
};

export const getActiveOtp = async (email: string, options: QueryOptions = { raw: true }) => {
  return await otpModel.findOne({
    where: {
      email,
      active: true,
      createdAt: {
        [Op.gte]: new Date(Date.now() - Number(OTP_VALIDITY_MINUTES) * 60 * 1000),
      },
    },
    ...options,
  });
};

export const listAllOtpsByEmail = async (email: string, options: QueryOptions = { raw: true }) => {
  return await otpModel.findAll({
    where: {
      email,
    },
    order: [['createdAt', 'DESC']],
    ...options,
  });
};
