import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';
import { validateRequest } from 'utils/jwt';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const session = await validateRequest(req, res);
    if (!session) return res.status(401).json({ success: false, error: 'jwt expired' });

    const idirId = session?.preferred_username.split('@')[0];

    const result: any = await runQuery(
      'SELECT * from roster WHERE LOWER(technical_contact_idir_userid)=LOWER($1) OR LOWER(product_owner_idir_userid)=LOWER($1)',
      [idirId],
    );
    return res.send(result?.rows);
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
