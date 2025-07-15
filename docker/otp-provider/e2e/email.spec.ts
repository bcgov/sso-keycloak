import { test, expect } from '@playwright/test';
import models from '../src/modules/sequelize/models';
import { initURL } from './util';

const otpModel = models.get('Otp');

test.beforeEach(async () => {
  // Reset all OTPs between tests
  await otpModel.destroy({where: {}});
});

test('Email Validations', async ({ page }, testInfo) => {
  await page.goto(initURL);
  await expect(page.locator('#signin-form')).toMatchAriaSnapshot(`- textbox "Email"`);

  // Empty field validation
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#signin-form')).toMatchAriaSnapshot(`
    - textbox "Email"
    - text: Email is required.
    - button "Continue Caution" [disabled]:
      - img "Caution"
    `);

  // Re-enables on input change
  await page.getByRole('textbox', { name: 'Email' }).fill('a@');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

  // Invalid email message
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#signin-form')).toMatchAriaSnapshot(`
    - textbox "Email": a@
    - text: Invalid email.
    - button "Continue Caution" [disabled]:
      - img "Caution"
    `);

  await page.getByRole('textbox', { name: 'Email' }).fill('a@');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#signin-form')).toMatchAriaSnapshot(`
    - textbox "Email": a@
    - text: Invalid email.
    - button "Continue Caution" [disabled]:
      - img "Caution"
    `);

  // Proceeds with valid email. To prevent hitting cooldown for the parallel browsers, passing in the browser alias as part of email address.
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('**/otp')

  await expect(page.getByRole('heading')).toMatchAriaSnapshot(`- heading "Enter your verification code" [level=2]`);
});

test('Email Cooldown', async ({ page }, testInfo) => {
  // Fire a login to put the email into cooldown
  await page.goto(initURL);
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();

  // Attempt another login with the same email and expect the cooldown error
  await page.goto(initURL);
  await page.getByRole('textbox', { name: 'Email' }).fill(`${testInfo.project.name}@b.com`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.locator('#email-error')).toMatchAriaSnapshot(`- text: /Please wait \\d+ seconds before requesting a new code for this email address\\./`);
});
