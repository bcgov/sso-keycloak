import express, { NextFunction, Request, Response } from 'express';
import Provider from 'oidc-provider';
import { authorize, generateOtp, login, userConsent, abortLogin } from '../controllers/auth-controller';
import { resendOtp, userResendOtpWaitTimeSeconds } from '../controllers/otp-controller';
import { setNoCache } from '../utils/helpers';
import { errors } from 'oidc-provider';

export const oidcRouter = async (oidcProvider: Provider, optionalArgs: { cspNonce: string } = { cspNonce: '' }) => {
  const oidcRouter = express.Router();
  oidcRouter.get('/:uid', setNoCache, await authorize(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/otp', setNoCache, await generateOtp(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/login', setNoCache, await login(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/confirm', setNoCache, await userConsent(oidcProvider));
  oidcRouter.post('/:uid/abort', await abortLogin(oidcProvider));
  oidcRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      let errorMessage = 'An unexpected error occurred';
      let errorStatus = 500;
      if (err instanceof errors.OIDCProviderError) {
        errorMessage = err.message;
        errorStatus = err.status || 500;
      }
      return res.status(errorStatus).render('error', {
        error: errorMessage,
      });
    }
  });

  return oidcRouter;
};
