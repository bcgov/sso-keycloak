import express, { NextFunction, Request, Response } from 'express';
import Provider from 'oidc-provider';
import { authorize, generateOtp, login, userConsent, abortLogin } from '../controllers/auth-controller';
import { setNoCache } from '../utils/helpers';
import { errors } from 'oidc-provider';
import logger from '../modules/winston.config';

export const oidcRouter = async (oidcProvider: Provider) => {
  const oidcRouter = express.Router();
  oidcRouter.get('/:uid', setNoCache, await authorize(oidcProvider));
  oidcRouter.post('/:uid/otp', setNoCache, await generateOtp(oidcProvider));
  oidcRouter.post('/:uid/login', setNoCache, await login(oidcProvider));
  oidcRouter.post('/:uid/confirm', setNoCache, await userConsent(oidcProvider));
  oidcRouter.post('/:uid/abort', await abortLogin(oidcProvider));
  oidcRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      logger.error('OIDC interaction error:', err);
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
