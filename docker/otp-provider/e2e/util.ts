/**
 * Redirect URI of the client application, i.e. user should get redirected here on successful login.
 */
export const redirectURI = 'http://localhost:3001';

export const clientId = 'pub-client';

/**
 * Dummy URL to initiate login. Ensure the seeding for the dummy public client from the readme has run.
 */
export const initURL = `http://localhost:3000/auth?client_id=${clientId}&redirect_uri=http://localhost:3001&response_type=code&scope=openid&code_challenge=TaU8J2MHlztGnfuA7N1JSDlGp9Q9kI9JhEVeE-pL3QA&code_challenge_method=S256`;

/**
 * Get a wrong otp for testing to avoid that 1 in a million flaky failure
 * @param otp string
 */
export const changeOTP = (otp: string) => {
  const otpChars = otp.split('');
  otpChars[0] = otpChars[0] === '0' ? '1' : '0';
  return otpChars.join('');
};

/**
 * Fill in an OTP code through playwright
 * @param otp The code to input
 * @param correctOTP Whether the code is correct or not
 * @param page Playwright page object
 */
export const fillOTP = async (otp: string, correctOTP: boolean, page: any) => {
  for (let i = 0; i < 6; i++) {
    await page.getByRole('textbox', { name: `Digit ${i + 1}` }).fill(otp[i]);

    // Last digit auto-submits, wait for page to reload (back to login if incorrect or to the redirect uri if correct)
    if (i === 5) {
      if (!correctOTP) await page.waitForURL('**/login');
      else
        await page.waitForRequest((req) => {
          return req.url().startsWith(redirectURI);
        });
    }
  }
};
