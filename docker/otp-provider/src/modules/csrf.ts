import { csrfSync } from 'csrf-sync';
import type { Request } from 'express';

const { generateToken, csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req: Request) => {
    return req.body['_csrf'] || req.query._csrf || req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  },
});

export const csrfProtectionMiddleware = csrfSynchronisedProtection;

// Csrf tokens are new for each requests
export const csrfToken = (req: Request) => generateToken(req);
