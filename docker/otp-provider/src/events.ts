import Provider, { AccessToken, ErrorOut, KoaContextWithOIDC, RefreshToken } from 'oidc-provider';
import logger from './modules/winston.config';
import { config } from './config';

const { NODE_ENV, LOG_LEVEL } = config;

export const generateEvents = (provider: Provider) => {
  logger.info('Generating events for OIDC provider');
  const eventTypes = [
    'access_token.destroyed',
    'access_token.saved',
    'access_token.issued',
    'authorization_code.consumed',
    'authorization_code.destroyed',
    'authorization_code.saved',
    'authorization.accepted',
    'authorization.error',
    'authorization.success',
    'backchannel.error',
    'backchannel.success',
    'jwks.error',
    'client_credentials.destroyed',
    'client_credentials.saved',
    'client_credentials.issued',
    'device_code.consumed',
    'device_code.destroyed',
    'device_code.saved',
    'discovery.error',
    'end_session.error',
    'end_session.success',
    'grant.error',
    'grant.revoked',
    'grant.success',
    'initial_access_token.destroyed',
    'initial_access_token.saved',
    'interaction.destroyed',
    'interaction.ended',
    'interaction.saved',
    'interaction.started',
    'introspection.error',
    'replay_detection.destroyed',
    'replay_detection.saved',
    'pushed_authorization_request.error',
    'pushed_authorization_request.success',
    'pushed_authorization_request.destroyed',
    'pushed_authorization_request.saved',
    'refresh_token.consumed',
    'refresh_token.destroyed',
    'refresh_token.saved',
    'registration_access_token.destroyed',
    'registration_access_token.saved',
    'registration_create.error',
    'registration_create.success',
    'registration_delete.error',
    'registration_delete.success',
    'registration_read.error',
    'registration_update.error',
    'registration_update.success',
    'revocation.error',
    'server_error',
    'session.destroyed',
    'session.saved',
    'userinfo.error',
  ];

  // Log all OIDC events on debug
  if (LOG_LEVEL === 'debug') {
    eventTypes.map((event) => {
      provider.on(event, (ctx: KoaContextWithOIDC) => {
        logger.info({
          event,
          client_id: ctx?.oidc?.client?.clientId,
          user_agent: ctx?.request?.headers['user-agent'],
          ip: ctx?.request?.ip,
          method: ctx?.request?.method,
          url: ctx?.request?.url,
        });
      });
    });
    return;
  }



  eventTypes.map((event) => {
    if (
      [
        'interaction.started',
        'interaction.ended',
        'end_session.success',
        'grant.success',
        'grant.revoked',
        'authorization.success',
        'authorization.accepted',
      ].includes(event)
    ) {
      provider.on(event, (ctx: KoaContextWithOIDC, ...rest: any) => {
        logger.info({
          event,
          client_id: ctx?.oidc?.client?.clientId,
          user_agent: ctx?.request?.headers['user-agent'],
          ip: ctx?.request?.ip,
          method: ctx?.request?.method,
          url: ctx?.request?.url,
          grantId: rest?.grantId || '',
        });
      });
    }
  });

  eventTypes.map((event) => {
    if (['access_token.issued', 'refresh_token.consumed'].includes(event)) {
      provider.on(event, (token: AccessToken | RefreshToken) => {
        logger.info({
          event,
          client_id: token?.client?.clientId,
          sessionUid: token?.sessionUid,
          message: event,
          grantId: token?.grantId,
          accountId: token?.accountId,
        });
      });
    }
  });

  // capture all the error events
  eventTypes.map((event) => {
    if (event.endsWith('error')) {
      provider.on(event, (ctx: KoaContextWithOIDC, error: ErrorOut) => {
        logger.error({
          event,
          error: error?.error,
          message: error?.error_description,
          user_agent: ctx?.request?.headers?.['user-agent'],
          ip: ctx?.request?.ip,
          method: ctx?.request?.method,
          url: ctx?.request?.url,
        });
      });
    }
  });
};
