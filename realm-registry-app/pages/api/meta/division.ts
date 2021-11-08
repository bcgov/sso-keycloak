import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const { ministry } = req.query;
    if (!ministry) return res.send([]);

    if (req.method === 'GET') {
      const result: any = await runQuery('SELECT DISTINCT division from rosters WHERE ministry=$1 ORDER BY division asc', [ministry]);
      return res.send(result?.rows.map((v: { division: string }) => v.division).concat('Other') || ['Other']);
    } else {
      return res.send(['Other']);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
