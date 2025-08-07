import { test, expect } from '@playwright/test';
import models from '../src/modules/sequelize/models';
import { changeOTP, fillOTP, initURL, clientId } from './util';
import { config } from '../src/config';

const otpModel = models.get('Otp');
const eventModel = models.get('Event');

test.beforeEach(async () => {
  // Reset all OTPs between tests
  await otpModel.destroy({ where: {} });
  await eventModel.destroy({ where: {} });
});

test('Send Code Event', async ({ page }, testInfo) => {
  await page.goto(initURL);
  const email = `${testInfo.project.name}@b.com`;

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');
  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);

  let requestCodeEvents = await eventModel.findAll({ where: { eventType: 'REQUEST_OTP', email, clientId } });
  let resendCodeEvents = await eventModel.findAll({ where: { eventType: 'RESEND_OTP', email, clientId } });

  expect(requestCodeEvents.length).toBe(1);
  expect(resendCodeEvents.length).toBe(0);

  // The variable OTP_RESENDS_ALLOWED_PER_DAY is actually sends per day, including the initial. Hence the minus 1 here
  // Check each new resend creates an event
  for (let i = 0; i < Number(config.OTP_RESENDS_ALLOWED_PER_DAY); i++) {
    await expect(page.locator('#new-code-text')).toMatchAriaSnapshot(
      `
        - text: Can't find the code?
        - button "Send a new code"
        `,
      { timeout: 25000 },
    );
    await page.getByRole('button', { name: 'Send a new code' }).click();
    await page.waitForURL('**/otp');
    resendCodeEvents = await eventModel.findAll({ where: { eventType: 'RESEND_OTP', email, clientId } });
    expect(resendCodeEvents.length).toBe(i + 1);
  }

  // Check max_resend event is not trigerred yet. Attempt a new login and expect event to be logged.
  let maxResendEvents = await eventModel.findAll({ where: { eventType: 'MAX_RESENDS', email, clientId } });
  expect(maxResendEvents.length).toBe(0);
  await page.goto(initURL);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.locator('#signin-form')).toMatchAriaSnapshot(`
    - textbox "Email"
    - text: You have reached the maximum number of OTP requests for today. Please try again tomorrow.
    - button "Continue"
    `);

  maxResendEvents = await eventModel.findAll({ where: { eventType: 'MAX_RESENDS', email, clientId } });
  expect(maxResendEvents.length).toBe(1);
});

test('Retry code event', async ({ page }, testInfo) => {
  await page.goto(initURL);
  const email = `${testInfo.project.name}@b.com`;

  // Enter email and go to OTP page
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp');

  const currentOtp = await otpModel
    .findOne({ where: { email: `${testInfo.project.name}@b.com`, active: true } })
    .then((res) => res.otp);
  const wrongOTP = changeOTP(String(currentOtp));

  // Verify at zero to start
  let invalidOtpEvents = await eventModel.findAll({ where: { eventType: 'INVALID_OTP', email, clientId } });
  let maxAttemptsEvents = await eventModel.findAll({ where: { eventType: 'MAX_ATTEMPTS', email, clientId } });

  expect(invalidOtpEvents.length).toBe(0);
  expect(maxAttemptsEvents.length).toBe(0);

  for (let i = 0; i <= Number(config.OTP_ATTEMPTS_ALLOWED); i++) {
    await fillOTP(wrongOTP, false, page);
    await page.waitForSelector('#otp-error');
    invalidOtpEvents = await eventModel.findAll({ where: { eventType: 'INVALID_OTP', email, clientId } });
    expect(invalidOtpEvents.length).toBe(i + 1);

    if (i === Number(config.OTP_ATTEMPTS_ALLOWED)) {
      maxAttemptsEvents = await eventModel.findAll({ where: { eventType: 'MAX_ATTEMPTS', email, clientId } });
      expect(maxAttemptsEvents.length).toBe(1);
    }
  }
});

test('Expired OTP Event', async ({ page }, testInfo) => {
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

  // Verify at zero to start
  let expiredOtpEvents = await eventModel.findAll({ where: { eventType: 'EXPIRED_OTP', email, clientId } });
  expect(expiredOtpEvents.length).toBe(0);

  // assert filling in otp creates event
  await fillOTP(currentOtp.otp, false, page);
  expiredOtpEvents = await eventModel.findAll({ where: { eventType: 'EXPIRED_OTP', email, clientId } });
  expect(expiredOtpEvents.length).toBe(1);
});
