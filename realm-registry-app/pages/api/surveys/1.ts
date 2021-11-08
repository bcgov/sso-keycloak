import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';
import { validateRequest } from 'utils/jwt';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string | any;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const session = await validateRequest(req, res);
    if (!session) return res.status(401).json({ success: false, error: 'jwt expired' });

    if (req.method === 'GET') {
      const result: any = await runQuery('SELECT * from surveys_1 WHERE idir_userid=$1', [session?.idir_userid]);

      const survey = result?.rows.length > 0 ? result?.rows[0] : null;
      return res.send(survey);
    } else if (req.method === 'POST') {
      const { willing_to_move, when_to_move } = req.body;
      const result = await runQuery(
        `
          INSERT INTO surveys_1 (idir_userid, contact_email, willing_to_move, when_to_move)
          VALUES($1,$2,$3,$4)
          ON CONFLICT (idir_userid)
          DO NOTHING`,
        [session?.idir_userid, session?.email, willing_to_move, when_to_move],
      );

      return res.send(result);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
