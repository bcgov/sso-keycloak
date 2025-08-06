import crypto from 'node:crypto';

export const generateCodeVerifierChallenge = () => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url'); // 43-128 characters
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = hash.toString('base64url');

  return { codeVerifier, codeChallenge };
};
