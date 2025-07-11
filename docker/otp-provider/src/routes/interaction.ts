import express, { NextFunction, Request, Response, urlencoded } from 'express';
import Provider from 'oidc-provider';
import { authorize, generateOtp, login, abortLogin } from '../controllers/auth-controller';
import { LoginTimeoutError, setNoCache } from '../utils/helpers';
import { errors } from 'oidc-provider';
import logger from '../modules/winston.config';

const body = urlencoded({ extended: false });

export const oidcRouter = async (oidcProvider: Provider) => {
  const oidcRouter = express.Router();
  oidcRouter.get('/:uid', setNoCache, await authorize(oidcProvider));
  oidcRouter.post('/:uid/otp', setNoCache, body, await generateOtp(oidcProvider));
  oidcRouter.post('/:uid/login', setNoCache, body, await login(oidcProvider));
  oidcRouter.post('/:uid/abort', await abortLogin(oidcProvider));
  oidcRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      logger.error('OIDC interaction error:', err);
      let errorMessage = 'An unexpected error occurred';
      let errorStatus = 500;
      if (err instanceof LoginTimeoutError) {
        errorStatus = err.status || 408;
        errorMessage = err.message;
      } else if (err instanceof errors.InvalidRequest) {
        errorMessage = 'Invalid request parameters sent.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.InvalidGrant) {
        errorMessage = 'The provided grant is invalid or expired.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.InvalidClient) {
        errorMessage = 'Client authentication failed.';
        errorStatus = err.status || 401;
      } else if (err instanceof errors.InvalidRedirectUri) {
        errorMessage = 'The redirect URI is invalid or not registered.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.InvalidScope) {
        errorMessage = 'One or more requested scopes are invalid.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.AccessDenied) {
        errorMessage = 'The request was denied by the user or server.';
        errorStatus = err.status || 403;
      } else if (err instanceof errors.InteractionRequired) {
        errorMessage = 'User interaction is required to continue.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.ConsentRequired) {
        errorMessage = 'User consent is required for this action.';
        errorStatus = err.status || 400;
      } else if (err instanceof errors.LoginRequired) {
        errorMessage = 'User login is required to proceed.';
        errorStatus = err.status || 401;
      } else if (err instanceof errors.InvalidToken) {
        errorMessage = 'The provided token is invalid or expired.';
        errorStatus = err.status || 401;
      } else if (err instanceof errors.SessionNotFound) {
        errorMessage = 'User session could not be found.';
        errorStatus = err.status || 400;
      }
      return res.status(errorStatus).render('error', {
        title: errorStatus,
        message: errorMessage,
      });
    }
  });

  return oidcRouter;
};
