import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';
import { validateRequest } from 'utils/jwt';
import { getAdminClient, getIdirUser } from 'utils/keycloak-core';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const { id } = req.query;
    const { description, product_name, openshift_namespace, product_owner_email, technical_contact_email } = req.body;

    const session = await validateRequest(req, res);
    if (!session) return res.status(401).json({ success: false, error: 'jwt expired' });
    const idirId = session?.preferred_username.split('@')[0];

    if (req.method === 'GET') {
      const result: any = await runQuery(
        'SELECT * from roster WHERE id=$1 AND (LOWER(technical_contact_idir_userid)=LOWER($2) OR LOWER(product_owner_idir_userid)=LOWER($2))',
        [id, idirId],
      );

      const realm = result?.rows.length > 0 ? result?.rows[0] : null;
      if (realm) {
        const kcAdminClient = await getAdminClient();
        if (kcAdminClient) {
          const poUser = await getIdirUser(realm.product_owner_idir_userid);
          console.log(poUser);
        }
      }

      return res.send(realm);
    } else if (req.method === 'PUT') {
      const result: any = await runQuery(
        `
        UPDATE roster
        SET
          description=$3,
          product_name=$4,
          openshift_namespace=$5,
          product_owner_email=$6,
          technical_contact_email=$7,
          updated_at=now()
        WHERE id=$1 AND (LOWER(technical_contact_idir_userid)=LOWER($2) OR LOWER(product_owner_idir_userid)=LOWER($2))
        RETURNING *`,
        [id, idirId, description, product_name, openshift_namespace, product_owner_email, technical_contact_email],
      );

      const realm = result?.rows.length > 0 ? result?.rows[0] : null;
      return res.send(realm);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
