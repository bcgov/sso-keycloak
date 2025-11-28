import Provider from 'oidc-provider';
import { NextFunction, Request, Response } from 'express';
import { getOtpWaitTime, requestOtp, verifyOtp } from '../services/otp';
import { emailValidator, otpValidator } from '../utils/shared';
import { sendEmail } from '../mailer';
import { getInteractionById } from '../modules/sequelize/queries/interaction';
import { LoginTimeoutError } from '../utils/helpers';
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
      if (req.params?.uid && (await isInteractionSessionExpired(String(req.params?.uid))))
        throw new LoginTimeoutError();
      const {
        uid,
        prompt: { name },
        result: oidcResult,
        params: { client_id: clientID },
      } = await oidcProvider.interactionDetails(req, res);

      if (name === 'login') {
        // Use the provided email falling back to session email. Session email applies when regenerating codes after already reaching the OTP entry screen.
        const email = req.body.email || oidcResult?.login?.email || '';

        // Rerender signin page with email error if invalid
        let [emailValid, emailValidityError] = emailValidator(email);
        if (!emailValid) {
          return res.render(`signin`, {
            uid,
            error: emailValidityError,
            nonce: res.locals.cspNonce,
            waitTime: 0,
          });
        }

        const { waitTime, error, newOtp } = await requestOtp(email, clientID as string);

        if (error) {
          return res.render(`signin`, {
            uid,
            error: errors[error as keyof typeof errors],
            nonce: res.locals.cspNonce,
            waitTime,
          });
        }

        // Store the email in the interaction session
        await oidcProvider.interactionResult(req, res, {
          login: {
            email,
          },
        } as any);

        await sendEmail({
          to: [email],
          body: `<p>You are receiving this email because you are attempting to sign in to a BC Government website.</p>
          <p>Copy and enter this 6-digit verification code to the One Time Passcode login page. This code will expire in 5 minutes.</p>
          <p style="font-size:24px;"><strong>${newOtp}</strong></p>
          <p>Do not share this code or forward this email to anyone.</p>
          <p>If this wasn't you, please ignore this message.</p>
          <p>This is an automated message from the Government of British Columbia. Please do not reply.</p>
          `,
          subject: `${newOtp} is your verification code.`,
        });

        return res.render('otp', {
          uid,
          email,
          error: '',
          nonce: res.locals.cspNonce,
          waitTime,
          disableResend: waitTime === -1 ? true : false,
          disableForm: false,
          disableResendError: waitTime === -1 ? errors['OTPS_LIMIT_REACHED'] : '',
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
        params: { client_id: clientID },
      } = await oidcProvider.interactionDetails(req, res);

      if (name === 'login') {
        const { code1, code2, code3, code4, code5, code6 } = req.body;
        const email = (oidcResult?.login?.email as string) || '';

        // Run form validation server side
        const [otp, otpError] = otpValidator([code1, code2, code3, code4, code5, code6]);
        if (otpError) {
          const waitTime = await getOtpWaitTime(email, clientID as string);
          return res.render('otp', {
            uid,
            email,
            nonce: res.locals.cspNonce,
            waitTime,
            disableResend: waitTime === -1 ? true : false,
            disableForm: false,
            error: otpError,
            disableResendError: waitTime === -1 ? errors['OTPS_LIMIT_REACHED'] : '',
          });
        }

        const { waitTime, error } = await verifyOtp(email, otp as string, clientID as string);
        if (error) {
          // Expiry page has a customized view, all others use the default.
          const view = error === 'EXPIRED_OTP' ? 'expired' : 'otp';
          return res.render(view, {
            uid,
            email,
            nonce: res.locals.cspNonce,
            waitTime,
            disableResend: waitTime === -1 ? true : false,
            disableForm: error === 'EXPIRED_OTP_WITH_RESEND',
            error: errors[error as keyof typeof errors],
            disableResendError: waitTime === -1 ? errors['OTPS_LIMIT_REACHED'] : '',
          });
        }

        const result = {
          login: {
            accountId: email,
          },
        };

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
