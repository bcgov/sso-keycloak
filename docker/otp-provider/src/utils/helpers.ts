import * as crypto from 'crypto';
import { config } from '../config';

const { HASH_SALT } = config;

export const generateOtpWithExpiry = () => {
  const otp = crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-6);
  const otpExpiry = Date.now() + 5 * 60 * 1000; // Set OTP expiry time to 5 minutes
  return {
    otp,
    expiresAt: new Date(otpExpiry),
  };
};

export const isOtpValid = (otp: string, expiresAt: Date): boolean => {
  const currentTime = new Date();
  return otp.length === 6 && currentTime < expiresAt && /^\d+$/.test(otp);
};

export const isOrigin = (value: string) => {
  return typeof value === 'string' && URL.parse(value)?.origin === value;
};

export const hashEmail = (email: string) => {
  const salt = Buffer.from(HASH_SALT);
  const combined = Buffer.concat([Buffer.from(email, 'utf8'), salt]);
  return crypto.createHash('sha256').update(combined).digest('hex');
};
