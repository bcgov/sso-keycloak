import express, { NextFunction, Request, Response } from 'express';
import Provider from 'oidc-provider';
import { authorize, generateOtp, login, userConsent, abortLogin } from './controllers/auth-controller';

const setNoCache = (req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
};

export const setRoutes = async (oidcProvider: Provider) => {
  const appRouter = express.Router();
  appRouter.get('/interaction/:uid', setNoCache, await authorize(oidcProvider));
  appRouter.post('/interaction/:uid/otp', setNoCache, await generateOtp(oidcProvider));
  appRouter.post('/interaction/:uid/login', setNoCache, await login(oidcProvider));
  appRouter.post('/interaction/:uid/confirm', setNoCache, await userConsent(oidcProvider));
  appRouter.post('/interaction/:uid/abort', await abortLogin(oidcProvider));

  return appRouter;
};
