import type { NextApiRequest, NextApiResponse } from 'next';
import { runQuery } from 'utils/db';
import { validateRequest } from 'utils/jwt';
import { getAdminClient, getIdirUserName, getRealm } from 'utils/keycloak-core';
import { sendUpdateEmail } from 'utils/mailer';

interface ErrorData {
  success: boolean;
  error: string | object;
}

type Data = ErrorData | string;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const { id } = req.query;

    const session = await validateRequest(req, res);
    if (!session) return res.status(401).json({ success: false, error: 'jwt expired' });

    if (req.method === 'GET') {
      const result: any = await runQuery(
        'SELECT * from rosters WHERE id=$1 AND (LOWER(technical_contact_idir_userid)=LOWER($2) OR LOWER(product_owner_idir_userid)=LOWER($2))',
        [id, session?.idir_userid],
      );

      const realm = result?.rows.length > 0 ? result?.rows[0] : null;
      if (realm) {
        const [realmData, poName, techName] = await Promise.all([
          getRealm(realm.realm),
          getIdirUserName(realm.product_owner_idir_userid),
          getIdirUserName(realm.technical_contact_idir_userid),
        ]);

        realm.product_owner_name = poName;
        realm.technical_contact_name = techName;
        realm.displayName = realmData?.displayName || '';
        realm.idps = realmData?.identityProviders?.map((v) => v.displayName || v.alias) || [];
      }

      return res.send(realm);
    } else if (req.method === 'PUT') {
      const {
        ministry,
        ministry_other,
        division,
        division_other,
        branch,
        branch_other,
        product_name,
        openshift_namespace,
        technical_contact_email,
        product_owner_email,
        technical_contact_idir_userid,
        product_owner_idir_userid,
      } = req.body;

      const _ministry = ministry === 'Other' ? ministry_other : ministry;
      const _division = division === 'Other' ? division_other : division;
      const _branch = branch === 'Other' ? branch_other : branch;

      const isPO = session?.idir_userid === product_owner_idir_userid;

      let result: any;
      if (isPO) {
        result = await runQuery(
          `
            UPDATE rosters
            SET
              product_name=$3,
              openshift_namespace=$4,
              technical_contact_email=$5,
              product_owner_email=$6,
              technical_contact_idir_userid=$7,
              ministry=$8,
              division=$9,
              branch=$10,
              updated_at=now()
            WHERE id=$1 AND LOWER(product_owner_idir_userid)=LOWER($2)
            RETURNING *`,
          [
            id,
            session?.idir_userid,
            product_name,
            openshift_namespace,
            technical_contact_email,
            product_owner_email,
            technical_contact_idir_userid,
            _ministry,
            _division,
            _branch,
          ],
        );
      } else {
        result = await runQuery(
          `
          UPDATE rosters
          SET
            product_name=$3,
            openshift_namespace=$4,
            technical_contact_email=$5,
            ministry=$6,
            division=$7,
            branch=$8,
            updated_at=now()
          WHERE id=$1 AND LOWER(technical_contact_idir_userid)=LOWER($2)
          RETURNING *`,
          [
            id,
            session?.idir_userid,
            product_name,
            openshift_namespace,
            technical_contact_email,
            _ministry,
            _division,
            _branch,
          ],
        );
      }

      const realm = result?.rows.length > 0 ? result?.rows[0] : null;
      sendUpdateEmail(realm, session);
      return res.send(realm);
    }
  } catch (err: any) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
