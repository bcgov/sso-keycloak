import { test, expect } from '@playwright/test';
import models from '../src/modules/sequelize/models';
import { config } from '../src/config';
import { errors } from '../src/utils/shared';
import { changeOTP, fillOTP, initURL, clientId, redirectURI } from './util';

const otpModel = models.get('Otp');
const eventModel = models.get('Event');

test.beforeEach(async () => {
  // Reset all OTPs between tests
  await otpModel.destroy({ where: {} });
  await eventModel.destroy({ where: {} });
});

test('OTP Validations', async ({ page }, testInfo) => {
  await page.goto(initURL);

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  await page.getByRole('textbox', { name: 'Digit 1' }).fill('a');
  await expect(page.locator('#otp-error')).toHaveText(errors.OTP_TYPES);
  const currentOtp = await otpModel
    .findOne({ where: { email: `${testInfo.project.name}@b.com`, active: true } })
    .then((res) => res.otp);
  const wrongOTP = changeOTP(String(currentOtp));

  await fillOTP(wrongOTP, false, page);

  await expect(page.locator('#otp-error')).toMatchAriaSnapshot(
    `- text: Invalid code entered. Please try again or send a new code.`,
  );
});

test('OTP submits when all digits are filled regardless of order', async ({ page }, testInfo) => {
  await page.goto(initURL);

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  const currentOtp = await otpModel
    .findOne({ where: { email: `${testInfo.project.name}@b.com`, active: true } })
    .then((res) => res.otp);

  // Fill the first 4 digits
  for (let i = 0; i < 4; i++) {
    await page.getByRole('textbox', { name: `Digit ${i + 1}` }).fill(currentOtp[i]);
  }
  // Fill the 6th digit
  await page.getByRole('textbox', { name: 'Digit 6' }).fill(currentOtp[5]);

  // Fill the 5th digit.
  await page.getByRole('textbox', { name: 'Digit 5' }).fill(currentOtp[4]);

  // Submission should run and send to the redirect
  await page.waitForRequest((req) => {
    return req.url().startsWith(redirectURI);
  });
});

test('OTP Resend Code Countdown', async ({ page }, testInfo) => {
  await page.goto(initURL);

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  // Resend code should have a cooldown counter since one was just sent
  await expect(page.locator('#wait-text')).toMatchAriaSnapshot(
    `- text: /Please wait \\d+ seconds before requesting a new code for this email address\\./`,
  );

  // Slow running case checking the send code button updates when the timer ends (60 seconds countdown)
  await expect(page.locator('#new-code-text')).toMatchAriaSnapshot(
    `
    - text: Can't find the code?
    - button "Send a new code"
    `,
    { timeout: 63000 },
  );
  // Resending code shows the countdown for the next interval
  await page.getByRole('button', { name: 'Send a new code' }).click();
  await page.waitForURL('**/otp');
  await expect(page.locator('#new-code-text')).toMatchAriaSnapshot(
    `- text: /Can't find the code\\? Please wait \\d+ seconds before requesting a new code for this email address\\./`,
  );
});

test('OTP Attempts Limit', async ({ page }, testInfo) => {
  await page.goto(initURL);

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  const currentOtp = await otpModel
    .findOne({ where: { email: `${testInfo.project.name}@b.com`, active: true } })
    .then((res) => res.otp);
  const wrongOTP = changeOTP(String(currentOtp));

  for (let i = 0; i < Number(config.OTP_ATTEMPTS_ALLOWED); i++) {
    await fillOTP(wrongOTP, false, page);
    await expect(page.locator('#otp-error')).toMatchAriaSnapshot(
      `- text: Invalid code entered. Please try again or send a new code.`,
    );
  }

  await fillOTP(wrongOTP, false, page);
  await expect(page.locator('#otp-error')).toMatchAriaSnapshot(
    `- text: You've tried too many times. Please send a new code.`,
  );
  // Assert all inputs are disabled
  const inputs = await page.$$('input');
  for (const input of inputs) {
    const isDisabled = await input.isDisabled();
    expect(isDisabled).toBe(true);
  }
});

test('OTP Success', async ({ page }, testInfo) => {
  const email = `${testInfo.project.name}@b.com`;
  await page.goto(initURL);
  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  let verifiedOTPEvents = await eventModel.findAll({ where: { eventType: 'OTP_VERIFIED', email, clientId } });
  expect(verifiedOTPEvents.length).toBe(0);

  const currentOtp = await otpModel.findOne({ where: { email: email, active: true } }).then((res) => res.otp);

  await fillOTP(currentOtp, true, page);
  verifiedOTPEvents = await eventModel.findAll({ where: { eventType: 'OTP_VERIFIED', email, clientId } });
  expect(verifiedOTPEvents.length).toBe(1);
});

test('OTP Expired', async ({ page }, testInfo) => {
  await page.goto(initURL);
  const email = `${testInfo.project.name}@b.com`;

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');

  const currentOtp = await otpModel.findOne({ where: { email: `${testInfo.project.name}@b.com`, active: true } });

  // Set OTP timestamp to make it expired
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  await otpModel.update({ createdAt: fiveMinutesAgo }, { where: { id: currentOtp.id } });

  // assert filling in otp creates event
  await fillOTP(currentOtp.otp, false, page);
  await expect(page.locator('body')).toMatchAriaSnapshot(
    `- paragraph: The verification code sent to ${email} has expired after five minutes.`,
  );
});
