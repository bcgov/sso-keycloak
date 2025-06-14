import request, { Agent } from 'supertest';
import app, { initializeApp } from '../app';
import sequelize from '../modules/sequelize/config';
import { QueryTypes } from 'sequelize';

describe('otp login test', () => {
  let agent: Agent;
  let interactionPath = '';
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
      redirect_uri: 'http://localhost:3001',
      code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
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

    const otpRecords: any = await sequelize.query('select * from "Otp" where email=:email and active = true', {
      replacements: { email: 'testuser@gmail.com' },
      type: QueryTypes.SELECT,
    });
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
    const res = await agent.post(`${interactionPath}/login`).type('form').send(data);
    expect(res.status).toEqual(303);
  });
});
