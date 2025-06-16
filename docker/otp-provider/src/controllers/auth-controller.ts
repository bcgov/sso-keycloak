import Provider from 'oidc-provider';
import { NextFunction, Request, Response } from 'express';
import { requestNewOtp, validateOtp } from '../services/otp';
import { canRequestOtp, secondsRemainingToRequestNewOtp } from '../utils/otp';
import { errors } from 'src/modules/errors';

export const authorize = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, prompt } = await oidcProvider.interactionDetails(req, res);
      switch (prompt.name) {
        case 'login': {
          return res.render('signin', {
            uid,
            error: '',
            email: '',
            nonce: res.locals.cspNonce,
            waitTime: 0,
          });
        }
        case 'consent': {
          return res.render('consent', {
            uid,
          });
        }
        default:
          return undefined;
      }
    } catch (error) {
      return next(error);
    }
  };
};

export const generateOtp = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        uid,
        prompt: { name },
      } = await oidcProvider.interactionDetails(req, res);

      if (name === 'login') {
        const { email, otpType } = req.body;
        const errorTemplate = otpType === 'resend' ? 'otp' : 'signin';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const renderVars = {
          uid,
          email: email ?? "",
          nonce: res.locals.cspNonce,
          waitTime: 0,
          error: '',
          disableResend: true,
        };

        if (email.length > 254) return res.render(errorTemplate, { ...renderVars, error: errors.INVALID_EMAIL });
        if (!emailRegex.test(email)) return res.render(errorTemplate, { ...renderVars, error: errors.INVALID_EMAIL });

        const canRequest = await canRequestOtp(email);
        if (!canRequest) return res.render(errorTemplate, { ...renderVars, error: errors.OTPS_LIMIT_REACHED });

        let [waitTime, error] = await secondsRemainingToRequestNewOtp(email);
        if (error) return res.render(errorTemplate, { ...renderVars, error });

        if (waitTime !== 0) return res.render(errorTemplate, { ...renderVars, waitTime });

        await requestNewOtp(email);
        return res.render('otp', {
          uid,
          email,
          nonce: res.locals.cspNonce,
          disableResend: 'false',
          waitTime,
          error: '',
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const login = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        uid,
        prompt: { name },
      } = await oidcProvider.interactionDetails(req, res);

      let result;
      if (name === 'login') {
        const { email, otp } = req.body;

        const { verified, attemptsLeft } = await validateOtp(otp, email);

        let [time] = await secondsRemainingToRequestNewOtp(email);

        if (!verified) {
          if (attemptsLeft > 0) {
            return res.render('otp', {
              uid,
              email,
              error: `Invalid OTP, you have ${attemptsLeft} attempts left.`,
              nonce: res.locals.cspNonce,
              waitTime: time,
              disableResend: 'false',
            });
          } else {
            result = {
              error: 'Invalid or expired OTP',
              error_description: 'Invalid or expired OTP',
            };
          }
        } else {
          result = {
            login: {
              accountId: req.body?.email,
            },
          };
        }
        return oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const userConsent = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const interactionDetails = await oidcProvider.interactionDetails(req, res);
      const {
        prompt: { name, details },
        params,
        session: { accountId } = {},
      } = interactionDetails;
      if (name === 'consent') {
        let { grantId } = interactionDetails;
        let grant: any;

        if (grantId) {
          // we'll be modifying existing grant in existing session
          grant = await oidcProvider.Grant.find(grantId);
        } else {
          // we're establishing a new grant
          grant = new oidcProvider.Grant({
            accountId,
            clientId: params.client_id as string,
          });
        }

        if (details.missingOIDCScope) {
          grant.addOIDCScope((details.missingOIDCScope as any).join(' '));
        }
        if (details.missingOIDCClaims) {
          grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
          for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
            grant.addResourceScope(indicator, scopes.join(' '));
          }
        }

        grantId = await grant.save();

        const consent = { grantId: '' };
        if (!interactionDetails.grantId) {
          // we don't have to pass grantId to consent, we're just modifying existing one
          consent.grantId = grantId as string;
        }

        const result = { consent };

        return oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const abortLogin = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
      };
      await oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (error) {
      next(error);
    }
  };
};
