import { Express, Router } from 'express';
import { setNoCache } from '../utils/helpers';
import { resendOtp, userResendOtpWaitTimeSeconds } from '../controllers/otp-controller';
import { csrfProtectionMiddleware } from 'src/modules/csrf';

export const userRouter = async (app: Express) => {
  const userRouter = Router();
  userRouter.post(
    '/otp/resend-wait-time',
    setNoCache,
    csrfProtectionMiddleware,
    (await userResendOtpWaitTimeSeconds()) as any,
  );
  userRouter.post('/otp', setNoCache, csrfProtectionMiddleware, (await resendOtp()) as any);
  return userRouter;
};
