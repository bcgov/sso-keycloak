import Provider from 'oidc-provider';
import { NextFunction, Request, Response } from 'express';
import { requestNewOtp, validateOtp } from '../services/otp';
import { canRequestOtp, secondsRemainingToRequestNewOtp } from '../utils/otp';
import { emailValidator } from '../utils/validator';
import { errors } from '../modules/errors';

export const authorize = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, prompt } = await oidcProvider.interactionDetails(req, res);
      switch (prompt.name) {
        case 'login': {
          return res.render('signin', {
            uid,
            error: '',
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
        let error = '';
        let time = 0;
        const { email, otpType } = req.body;

        error = emailValidator(email);

        if (!error) {
          const canRequest = await canRequestOtp(email);
          if (!canRequest) {
            error = errors.OTPS_LIMIT_REACHED;
          } else {
            time = await secondsRemainingToRequestNewOtp(email);
          }
        }

        if (error) {
          if (otpType !== 'resend') {
            return res.render('signin', {
              uid,
              error,
              nonce: res.locals.cspNonce,
              waitTime: time,
            });
          }
        }

        if (!error && time === 0) {
          await requestNewOtp(email);
          const canRequest = await canRequestOtp(email);
          if (canRequest) time = await secondsRemainingToRequestNewOtp(email);
        }

        return res.render('otp', {
          uid,
          email,
          error,
          nonce: res.locals.cspNonce,
          waitTime: error ? 0 : time,
          disableResend: error ? 'true' : 'false',
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
      let time = 0;
      let error = '';

      if (name === 'login') {
        let validatedOtp = { verified: false, attemptsLeft: 0 };
        const { email, otp } = req.body;

        let disableResend = 'false';

        validatedOtp = await validateOtp(otp, email);

        const canRequest = await canRequestOtp(email);

        if (canRequest) time = await secondsRemainingToRequestNewOtp(email);

        if (!validatedOtp.verified) {
          const otpRenderParams = {
            uid,
            email,
            error,
            nonce: res.locals.cspNonce,
            waitTime: time,
            disableResend,
          };
          if (validatedOtp.attemptsLeft > 0) {
            error = `Invalid OTP, you have ${validatedOtp.attemptsLeft} attempts left.`;
            return res.render('otp', { ...otpRenderParams, error });
          } else if (validatedOtp.attemptsLeft === 0 && (await canRequestOtp(email))) {
            error = errors.EXPIRED_OTP_WITH_RESEND;
            return res.render('otp', { ...otpRenderParams, error });
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
