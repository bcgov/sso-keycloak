import { test, expect } from '@playwright/test';

for (let i = 0; i < 200; i++) {
    test(`OTP Validations run ${i}`, async ({ page }, testInfo) => {
        await page.goto('https://bcgov.github.io/keycloak-example-apps/');
        await page.getByText('Keycloak OIDC Config').click();
        await page.getByRole('textbox', { name: 'e.g https://dev.loginproxy.' }).click();
        await page.getByRole('textbox', { name: 'e.g https://dev.loginproxy.' }).fill('https://dev.sandbox.loginproxy.gov.bc.ca/auth');
        await page.getByRole('textbox', { name: 'Client ID (resource)' }).click();
        await page.getByRole('textbox', { name: 'Client ID (resource)' }).fill('');
        await page.getByRole('textbox', { name: 'Client ID (resource)' }).click({
            modifiers: ['ControlOrMeta']
        });
        await page.getByRole('textbox', { name: 'Client ID (resource)' }).fill('otp-prod-approve-20153');
        await page.getByRole('button', { name: 'Update' }).click();
        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Login' }).click();

        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill('test@mail.com');
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('textbox', { name: 'Digit 1' }).fill('1');
        await page.getByRole('textbox', { name: 'Digit 2' }).fill('1');
        await page.getByRole('textbox', { name: 'Digit 3' }).fill('1');
        await page.getByRole('textbox', { name: 'Digit 4' }).fill('1');
        await page.getByRole('textbox', { name: 'Digit 5' }).fill('1');
        await page.waitForTimeout(2000);
        await page.getByRole('textbox', { name: 'Digit 6' }).fill('1');
        await expect(page).toHaveURL('https://bcgov.github.io/keycloak-example-apps/', {timeout: 10_000})
    });
}


// {
//   "confidential-port": 0,
//   "auth-server-url": "https://dev.sandbox.loginproxy.gov.bc.ca/auth",
//   "realm": "standard",
//   "ssl-required": "external",
//   "public-client": true,
//   "resource": "otp-prod-approve-20153"
// }
