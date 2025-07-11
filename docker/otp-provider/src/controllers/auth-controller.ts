import Provider from 'oidc-provider';
import { NextFunction, Request, Response } from 'express';
import { requestNewOtp, validateOtp } from '../services/otp';
import { canRequestOtp, secondsRemainingToRequestNewOtp } from '../utils/otp';
import { emailValidator, otpValidator } from '../utils/shared';
import { errors } from '../modules/errors';
import { getInteractionById } from '../modules/sequelize/queries/interaction';
import { LoginTimeoutError } from '../utils/helpers';

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
      if (req.params?.uid && (await isInteractionSessionExpired(String(req.params?.uid))))
        throw new LoginTimeoutError();
      const {
        uid,
        prompt: { name },
        result: oidcResult,
      } = await oidcProvider.interactionDetails(req, res);

      if (name === 'login') {
        let time = 0;
        const email = (oidcResult?.login?.email as string) || req.body.email;
        const { otpType } = req.body;

        // Rerender signin page with email error if invalid
        let [emailValid, error] = emailValidator(email);
        if (!emailValid) {
          return res.render(`signin`, {
            uid,
            error,
            nonce: res.locals.cspNonce,
            waitTime: 0,
          });
        }

        if (!error) {
          const canRequest = await canRequestOtp(email);
          if (!canRequest) {
            error = errors.OTPS_LIMIT_REACHED;
          } else {
            time = await secondsRemainingToRequestNewOtp(email);
            // Render a message with time to wait to get a new code
            if (time > 0) {
              return res.render('signin', {
                uid,
                error,
                nonce: res.locals.cspNonce,
                waitTime: time,
              });
            }
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

        // Store email in the interaction
        oidcProvider.interactionResult(req, res, {
          login: {
            email,
          },
        } as any);

        return res.render('otp', {
          uid,
          email,
          error,
          nonce: res.locals.cspNonce,
          waitTime: error ? 0 : time,
          disableResend: false,
          disableForm: false,
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
      if (req.params?.uid && (await isInteractionSessionExpired(String(req.params?.uid))))
        throw new LoginTimeoutError();

      const {
        uid,
        prompt: { name },
        result: oidcResult,
      } = await oidcProvider.interactionDetails(req, res);

      let result;
      let time = 0;
      let error = '';

      if (name === 'login') {
        let validatedOtp = { verified: false, attemptsLeft: 0, expired: false };
        const { code1, code2, code3, code4, code5, code6 } = req.body;
        const email = (oidcResult?.login?.email as string) || '';

        // Run form validation server side
        const [otp, otpError] = otpValidator([code1, code2, code3, code4, code5, code6]);
        if (otpError)
          return res.render('otp', {
            uid,
            email,
            nonce: res.locals.cspNonce,
            waitTime: time,
            disableResend: false,
            disableForm: false,
            error: otpError,
          });

        let disableResend = false;
        validatedOtp = await validateOtp(otp as string, email);
        const canRequest = await canRequestOtp(email);
        if (canRequest) time = await secondsRemainingToRequestNewOtp(email);

        if (validatedOtp.expired) {
          return res.render('expired', {
            email,
            uid,
            nonce: res.locals.cspNonce,
            waitTime: time,
          });
        }

        if (!validatedOtp.verified) {
          const otpRenderParams = {
            uid,
            email,
            error,
            nonce: res.locals.cspNonce,
            waitTime: time,
            disableResend,
            disableForm: false,
          };
          if (validatedOtp.attemptsLeft > 0) {
            error = errors.INVALID_OTP;
            return res.render('otp', { ...otpRenderParams, error });
          } else if (validatedOtp.attemptsLeft === 0 && (await canRequestOtp(email))) {
            error = errors.EXPIRED_OTP_WITH_RESEND;
            return res.render('otp', { ...otpRenderParams, error, disableForm: true });
          } else {
            result = {
              error: 'Invalid or expired OTP',
              error_description: 'Invalid or expired OTP',
            };
          }
        } else {
          result = {
            login: {
              accountId: email,
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

const isInteractionSessionExpired = async (interactionUid: string) => {
  const interaction = await getInteractionById(interactionUid);
  if (interaction && new Date().getTime() >= new Date(interaction.expiresAt).getTime()) return true;
  return false;
};
