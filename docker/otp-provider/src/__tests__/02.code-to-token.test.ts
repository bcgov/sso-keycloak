import request, { Agent } from 'supertest';
import app, { initializeApp } from '../app';
import sequelize from '../modules/sequelize/config';
import { QueryTypes } from 'sequelize';
import crypto from 'node:crypto';
import { getOtpsByEmail } from './helpers/queries';
import { errors } from '../modules/errors';

const codes = {
  code1: '1',
  code2: '1',
  code3: '1',
  code4: '1',
  code5: '1',
  code6: '1',
};

const formatCode = (otp: string) => {
  const codes: any = {};
  otp.split('').forEach((char, i) => {
    codes[`code${i + 1}`] = char;
  });
  return codes;
};

describe('otp login test', () => {
  let agent: Agent;
  let interactionPath = '';
  let consentInteractionPath = '';
  let authCode: string = '';
  let idToken = '';
  const codeVerifier = crypto.randomBytes(32).toString('base64url'); // 43-128 characters
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = hash.toString('base64url');
  beforeAll(async () => {
    await initializeApp(app);
    agent = request.agent(app);
  });

  it('should allow to access the server', async () => {
    const res = await agent.get('/.well-known/openid-configuration');
    expect(res.status).toEqual(200);
  });

  it('should accept authorization request and create an interaction session', async () => {
    const res = await agent.get('/auth').query({
      client_id: 'pub-client',
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    expect(res.status).toEqual(303);
    expect(res.headers.location).not.toBeNull();
    const interactionMatch = res.headers.location.match(/interaction\/([^/]+)/);
    const uid = interactionMatch?.[1];
    expect(uid).toBeDefined();
    interactionPath = res.headers.location;
  });

  it('should accept email at the login interaction', async () => {
    const data = { email: 'testuser@gmail.com' };
    const res = await agent.post(`${interactionPath}/otp`).type('form').send(data);
    expect(res.status).toEqual(200);

    const otpRecords: any[] = await getOtpsByEmail('testuser@gmail.com');
    expect(otpRecords[0].attempts).toEqual(0);
    expect(otpRecords[0].active).toBeTruthy();
  });

  it('should accept the invalid passcode at the otp interaction and return the expected error', async () => {
    const data = { email: 'testuser@gmail.com', ...codes };
    const res = await agent.post(`${interactionPath}/login`).type('form').send(data);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(errors.INVALID_OTP);

    const otpRecords: any = await sequelize.query('select * from "Otp" where email=:email and active = true', {
      replacements: { email: 'testuser@gmail.com' },
      type: QueryTypes.SELECT,
    });

    expect(otpRecords[0].attempts).toEqual(1);
  });

  it('should not allow to resend the otp before initial interval', async () => {
    const data = { email: 'testuser@gmail.com', otpType: 'resend' };
    const res = await agent.post(`${interactionPath}/otp`).type('form').send(data);
    expect(res.status).toEqual(200);

    const otpRecords: any = await sequelize.query('select * from "Otp" where email=:email order by "createdAt" desc', {
      replacements: { email: 'testuser@gmail.com' },
      type: QueryTypes.SELECT,
    });

    expect(otpRecords.length).toEqual(1);
    expect(otpRecords[0].active).toBeTruthy();
  });

  it('should accept correct passcode', async () => {
    const otpRecords: any = await sequelize.query('select * from "Otp" where email=:email and active = true', {
      replacements: { email: 'testuser@gmail.com' },
      type: QueryTypes.SELECT,
    });

    const codes = formatCode(otpRecords[0].otp);
    const data = { email: 'testuser@gmail.com', ...codes };
    const res = await agent.post(`${interactionPath}/login`).type('form').send(data).redirects(0);

    const resumeUrl = new URL(res.headers.location).pathname;

    const redirectToClient = await agent.get(resumeUrl).redirects(0);

    expect(redirectToClient.status).toBe(303);

    const redirectUrl = new URL(redirectToClient.headers.location);
    authCode = redirectUrl.searchParams.get('code')!;
    expect(authCode).toBeTruthy();
  });

  it('should return token when presented with the code', async () => {
    const tokenRes = await agent
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: 'http://localhost:3000/cb',
        client_id: 'pub-client',
        code_verifier: codeVerifier,
      })
      .expect(200);

    expect(tokenRes.body).toHaveProperty('access_token');
    expect(tokenRes.body).toHaveProperty('id_token');
    idToken = tokenRes.body.id_token;
  });

  it('should return expected claims in the id_token', () => {
    const [headerB64, payloadB64] = idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload).toHaveProperty('sub');
    expect(payload.sub).toEqual('testuser@gmail.com');
    expect(payload).toHaveProperty('otp_guid');
  });
});
