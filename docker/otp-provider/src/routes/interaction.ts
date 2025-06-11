import express, { NextFunction, Request, Response } from 'express';
import Provider from 'oidc-provider';
import { authorize, generateOtp, login, userConsent, abortLogin } from '../controllers/auth-controller';
import { resendOtp, userResendOtpWaitTimeSeconds } from '../controllers/otp-controller';
import { setNoCache } from '../utils/helpers';

export const oidcRouter = async (oidcProvider: Provider, optionalArgs: { cspNonce: string } = { cspNonce: '' }) => {
  const oidcRouter = express.Router();
  oidcRouter.get('/:uid', setNoCache, await authorize(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/otp', setNoCache, await generateOtp(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/login', setNoCache, await login(oidcProvider, optionalArgs?.cspNonce));
  oidcRouter.post('/:uid/confirm', setNoCache, await userConsent(oidcProvider));
  oidcRouter.post('/:uid/abort', await abortLogin(oidcProvider));

  return oidcRouter;
};
