import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchIssuerConfiguration, getAuthorizationUrl } from 'utils/oidc';

type Data = {
  success: boolean;
  error: string | object;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    await fetchIssuerConfiguration();
    const authUrl = await getAuthorizationUrl();
    console.log(authUrl);
    return res.redirect(authUrl);
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
