import Provider from 'oidc-provider';
import { NextFunction, Request, Response } from 'express';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { sendEmail } from '../mailer';
import { generateOtpWithExpiry, hashEmail, isOtpValid } from '../utils/helpers';

const debug = (obj: any) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc: Record<string, any>, [key, value]) => {
      keys.add(key);
      if (!value) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
      },
    },
  );

const keys = new Set();

const otps = new Map();

export const authorize = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, prompt, params, session } = await oidcProvider.interactionDetails(req, res);
      switch (prompt.name) {
        case 'login': {
          return res.render('signin', {
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
            error: '',
          });
        }
        case 'consent': {
          return res.render('consent', {
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          });
        }
        default:
          return undefined;
      }
    } catch (error) {
      next(error);
    }
  };
};

export const generateOtp = async (oidcProvider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        uid,
        prompt,
        params,
        session,
        prompt: { name },
      } = await oidcProvider.interactionDetails(req, res);
      if (name === 'login') {
        const { email } = req.body;
        if (!email) {
          return res.render('signin', {
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
            error: 'Email is required!',
          });
        }
        const { otp, expiresAt } = generateOtpWithExpiry();

        otps.set(req.body?.email, { otp, expiry: expiresAt });

        sendEmail({
          to: [email],
          body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
          subject: 'Your One-Time Password (OTP)',
        });

        return res.render('otp', {
          uid,
          email,
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

        if (!otp) {
          return res.render('otp', {
            uid,
            email,
            error: 'OTP is required!',
          });
        }

        const storedOtp = otps.get(email);
        if (!storedOtp || storedOtp.otp !== otp || !isOtpValid(otp, storedOtp.expiry)) {
          result = {
            error: 'Invalid or expired OTP',
            error_description: 'Invalid or expired OTP',
          };
        } else {
          result = {
            login: {
              accountId: hashEmail(req.body?.email),
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
        grantId,
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
