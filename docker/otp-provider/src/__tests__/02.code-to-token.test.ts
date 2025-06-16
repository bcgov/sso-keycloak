import request, { Agent } from 'supertest';
import app, { initializeApp } from '../app';
import sequelize from '../modules/sequelize/config';
import { QueryTypes } from 'sequelize';
import crypto from 'node:crypto';
import { getOtpsByEmail } from './helpers/queries';

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

  it('should accept the invalid passcode at the otp interaction and return attempts left', async () => {
    const data = { email: 'testuser@gmail.com', otp: '123456' };
    const res = await agent.post(`${interactionPath}/login`).type('form').send(data);
    expect(res.status).toEqual(200);
    expect(res.text).toContain('Invalid OTP, you have 4 attempts left');

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

  it('should accept correct passcode and redirect to consent page', async () => {
    const otpRecords: any = await sequelize.query('select * from "Otp" where email=:email and active = true', {
      replacements: { email: 'testuser@gmail.com' },
      type: QueryTypes.SELECT,
    });

    const data = { email: 'testuser@gmail.com', otp: otpRecords[0].otp };
    const res = await agent.post(`${interactionPath}/login`).type('form').send(data).redirects(0);
    expect(res.status).toEqual(303);
    const redirectRes = await agent.get(new URL(res.headers.location).pathname).redirects(0);
    expect(redirectRes.status).toEqual(303);
    consentInteractionPath = redirectRes.headers.location;
  });

  it('should allow for submitting consent and return code', async () => {
    const consentRes = await agent.post(`${consentInteractionPath}/confirm`).type('form').send({}).redirects(0);
    expect(consentRes.status).toEqual(303);
    const redirectRes = await agent.get(new URL(consentRes.headers.location).pathname).redirects(0);
    expect(redirectRes.status).toEqual(303);
    const code = new URL(redirectRes.headers.location).searchParams.get('code');
    expect(code).toBeTruthy;
    authCode = code || '';
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
