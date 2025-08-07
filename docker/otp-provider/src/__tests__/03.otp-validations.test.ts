import { Agent } from 'supertest';
import crypto from 'node:crypto';
import app, { initializeApp } from '../app';
import request from 'supertest';
import { errors } from '../modules/errors';
import { cleanUpOtps, createActiveOtp, createOtps, getOtpsByEmail } from './helpers/queries';
import { generateCodeVerifierChallenge } from './helpers/utils';

const userEmail = 'test-user-1@gov.bc.ca';

const clientId = 'pub-client';

const testClient = 'test-client';

let agent: Agent;

describe('validations', () => {
  let interactionPath = '';
  const { codeChallenge } = generateCodeVerifierChallenge();
  beforeAll(async () => {
    await initializeApp(app);
    agent = request.agent(app);
  });
  it('should perform email validations', async () => {
    const authRes = await agent.get('/auth').query({
      client_id: clientId,
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    expect(authRes.status).toEqual(303);
    interactionPath = authRes.headers.location;

    let loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: '' });
    expect(loginRes.status).toEqual(200);
    expect(loginRes.text).toContain(errors.EMAIL_REQUIRED);

    loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: 'invalid_email' });
    expect(loginRes.status).toEqual(200);
    expect(loginRes.text).toContain(errors.INVALID_EMAIL);
  });

  it('should not send a new otp if already sent within 60 seconds', async () => {
    await createOtps(userEmail, 1, clientId);
    const res = await agent.get('/auth').query({
      client_id: clientId,
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    expect(res.status).toEqual(303);
    interactionPath = res.headers.location;

    let loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: userEmail });
    expect(loginRes.status).toEqual(200);

    const otps = await getOtpsByEmail(userEmail);

    expect(otps.length).toEqual(1);
  });

  it('should throw error on signin page if otp requests reach the limit', async () => {
    await cleanUpOtps();
    await createOtps(userEmail, 5, clientId);
    const res = await agent.get('/auth').query({
      client_id: clientId,
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    expect(res.status).toEqual(303);
    interactionPath = res.headers.location;

    let loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: userEmail });
    expect(loginRes.status).toEqual(200);
    expect(loginRes.text).toContain(errors.OTPS_LIMIT_REACHED);
  });

  it('should throw error on otp page when resending otp if otp requests has reached limit', async () => {
    await cleanUpOtps();
    await createOtps(userEmail, 4, clientId);
    const res = await agent.get('/auth').query({
      client_id: clientId,
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    expect(res.status).toEqual(303);
    interactionPath = res.headers.location;

    let loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: userEmail });
    expect(loginRes.status).toEqual(200);

    await createActiveOtp(userEmail, clientId);

    loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: userEmail });
    expect(loginRes.status).toEqual(200);
    expect(loginRes.text).toContain(errors.OTPS_LIMIT_REACHED);
  });
});

describe('multi-client otps', () => {
  const { codeChallenge } = generateCodeVerifierChallenge();
  let interactionPath = '';
  it('allow creating otps with different clients for single user', async () => {
    await cleanUpOtps();
    await createOtps(userEmail, 1, clientId);
    const res = await agent.get('/auth').query({
      client_id: testClient,
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://localhost:3000/cb',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    expect(res.status).toEqual(303);
    interactionPath = res.headers.location;

    let loginRes = await agent.post(`${interactionPath}/otp`).type('form').send({ email: userEmail });
    expect(loginRes.status).toEqual(200);

    const otps = await getOtpsByEmail(userEmail);

    expect(otps.length).toEqual(2);
  });
});
