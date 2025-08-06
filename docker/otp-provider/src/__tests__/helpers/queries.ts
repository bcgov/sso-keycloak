import { generateOtp } from '../../utils/helpers';
import sequelize from '../../modules/sequelize/config';
import { QueryTypes } from 'sequelize';

export const getOtpsByEmail = async (email: string) => {
  return await sequelize.query(`SELECT * from public."Otp" where email='${email}'`, {
    type: QueryTypes.SELECT,
  });
};

export const cleanUpOtps = async () => {
  await sequelize.query(`TRUNCATE TABLE public."Otp"`);
};

export const createOtps = async (email: string, count: number, clientId: string) => {
  for (let i = 0; i < count; i++) {
    const active = i === count - 1 ? 'true' : 'false';
    await sequelize.query(
      `INSERT INTO public."Otp"("id", "otp", "email", "active", "clientId") VALUES('${crypto.randomUUID()}', '${generateOtp()}', '${email}', '${active}', '${clientId}')`,
    );
  }
};

export const createActiveOtp = async (email: string, clientId: string) => {
  await sequelize.query(`UPDATE public."Otp" SET "active"='false' where email='${email}'`);
  await sequelize.query(
    `INSERT INTO public."Otp"("id", "otp", "email", "active", "clientId") VALUES('${crypto.randomUUID()}', '${generateOtp()}', '${email}', 'true', '${clientId}')`,
  );
};

export const getActiveOtp = async (email: string) => {
  return await sequelize.query(`SELECT * from public."Otp" where email='${email}' and active='true'`, {
    type: QueryTypes.SELECT,
  });
};

export const createTestClients = async () => {
  ['pub-client', 'test-client'].forEach(async (client) => {
    await sequelize.query(`INSERT INTO public."ClientConfig"
      ("clientId",
      "grantTypes",
      "redirectUris",
      "scope",
      "responseTypes",
      "clientUri",
      "allowedCorsOrigins",
      "postLogoutRedirectUris",
      "tokenEndpointAuthMethod")
      VALUES('${client}',
        '{authorization_code, refresh_token}',
        '{http://localhost:3000/cb}',
        'openid email',
        '{code}',
        'http://localhost:3000',
        '{http://localhost:3000}',
        '{http://localhost:3000}',
        'none')`);
  });
};
