import jwt from 'jsonwebtoken';
import { getUserInfo } from '../../../../utils/cognito';
import { JWT_SECRET } from '../../../../utils/config';

export default async function handler(req, res) {
  try {
    const appAccessToken = req.headers['x-access-token'];
    const tokens = jwt.verify(appAccessToken, JWT_SECRET);
    const { access_token } = tokens;

    const info = await getUserInfo({ accessToken: access_token });
    return res.json({ success: true, data: info });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false, error: err.message || err });
  }
}
