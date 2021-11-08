import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const { ministry, division } = req.query;
    if (!ministry || !division) return res.send([]);

    if (req.method === 'GET') {
      const result: any = await runQuery(
        'SELECT DISTINCT branch from rosters WHERE ministry=$1 AND division=$2 ORDER BY branch asc',
        [ministry, division],
      );
      return res.send(result?.rows.map((v: { branch: string }) => v.branch).concat('Other') || ['Other']);
    } else {
      return res.send(['Other']);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
