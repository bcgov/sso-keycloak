import { sendEmail } from 'utils/ches';
import getConfig from 'next/config';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { app_env } = serverRuntimeConfig;

export const sendUpdateEmail = (realm: any, session: any) => {
  const prefix = app_env === 'development' ? '[DEV] ' : '';

  return sendEmail({
    // to: [realm.technical_contact_email, realm.product_owner_email],
    to: ['junmin@button.is'],
    body: `
<h1>Your Realm Registry has been updated.</h1>
<p>
    <strong>Project name: </strong>${realm.realm}<br /><strong>Updated by:</strong>${session.given_name} ${session.family_name}
</p>
    `,
    subject: `${prefix}Realm Registry has been updated`,
  });
};
