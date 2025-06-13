import request from 'supertest';
import app, { initializeApp } from '../app';
import sequelize from '../modules/sequelize/config';

describe('server', () => {
  beforeAll(async () => {
    await initializeApp(app);
  });
  it('should allow to access the server', async () => {
    const res = await request(app).get('/.well-known/openid-configuration');
    expect(res.status).toEqual(200);
  });
});
