import axios from 'axios';
import url from 'url';
import { config } from './config';
import logger from './modules/winston.config';

const { CHES_TOKEN_URL, CHES_API_URL, CHES_USERNAME, CHES_PASSWORD } = config;

interface EmailOptions {
  from?: string;
  to: string[];
  body: string;
  bodyType?: string;
  cc?: string[];
  bcc?: string[];
  delayTS?: number;
  encoding?: string;
  priority?: 'normal' | 'low' | 'high';
  subject?: string;
  tag?: string;
}

// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false,
// });

const fetchChesToken = async () => {
  const params = new url.URLSearchParams({ grant_type: 'client_credentials' });
  try {
    const { data } = await axios.post(CHES_TOKEN_URL, params.toString(), {
      headers: {
        'Accept-Encoding': 'application/json',
      },
      auth: {
        username: CHES_USERNAME,
        password: CHES_PASSWORD,
      },
    });

    const { access_token } = data as { access_token: string };
    return [access_token, null];
  } catch (err) {
    return [null, err];
  }
};

export const sendEmail = async ({ from = 'no-reply-sso@gov.bc.ca', to, body, ...rest }: EmailOptions) => {
  try {
    if (process.env.NODE_ENV === 'test') return true;
    const [accessToken, error] = await fetchChesToken();
    if (error) {
      throw new Error('unable to fetch ches token');
    }

    const res = await axios.post(
      CHES_API_URL,
      {
        // see https://ches.nrs.gov.bc.ca/api/v1/docs#operation/postEmail for options
        bodyType: 'html',
        body,
        encoding: 'utf-8',
        from,
        priority: 'normal',
        subject: 'CHES Email Message',
        to,
        ...rest,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return res;
  } catch (err) {
    logger.error(err);
  }
};
