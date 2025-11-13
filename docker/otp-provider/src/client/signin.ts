import { emailValidator } from '../utils/shared';
import { countdown, clearFormError, setFormError } from './shared';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin-form') as HTMLFormElement;
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const errorField = document.getElementById('email-error') as HTMLElement;
  const waitTimeElement = document.getElementById('wait-time-text');
  const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
  let submitting = false;

  if (!form || !emailInput || !errorField || !submitButton || !errorField) return;
  emailInput.addEventListener('input', () => {
    clearFormError(errorField, submitButton);
  });

  form.setAttribute('novalidate', '');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailContent = emailInput.value;
    const [emailValid, error] = emailValidator(emailContent);

    if (!emailValid) {
      setFormError(errorField, error as string, submitButton);
      return;
    }

    if (!submitting) {
      submitting = true;
      submitButton.disabled = true;
      form.submit();
    }
  });

  const cooldownPeriod = Number(emailInput.getAttribute('data-wait-time'));

  if (waitTimeElement) {
    countdown(cooldownPeriod, waitTimeElement, () => {
      clearFormError(errorField, submitButton);
    });
  }
});
