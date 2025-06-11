import { NextFunction, Request, Response } from 'express';
import { secondsRemainingToRequestNewOtp } from '../utils/otp';
import { requestNewOtp } from '../services/otp';

export const userResendOtpWaitTimeSeconds = async () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const seconds = await secondsRemainingToRequestNewOtp(email as string);
      return res.status(200).json({ seconds });
    } catch (error) {
      next(error);
    }
  };
};

export const resendOtp = async () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      await requestNewOtp(email as string);
      return res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };
};
