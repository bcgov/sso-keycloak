import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method === 'GET') {
      const result: any = await runQuery('SELECT DISTINCT ministry from rosters ORDER BY ministry asc');
      return res.send(result?.rows.map((v: { ministry: string }) => v.ministry).concat('Other') || ['Other']);
    } else {
      return res.send(['Other']);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
