import { emailValidator } from '../utils/shared';
import { countdown } from './shared';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin-form') as HTMLFormElement;
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const errorField = document.getElementById('email-error') as HTMLElement;
  const waitTimeElement = document.getElementById('wait-time-text');
  const submitButton = document.getElementById('submit-button') as HTMLButtonElement;

  if (!form || !emailInput || !errorField || !submitButton || !errorField) return;
  emailInput.addEventListener('input', () => {
    errorField.textContent = '';
    submitButton.disabled = false;
    const cautionImg = submitButton.querySelector('img');
    if (cautionImg) cautionImg.remove();
  });

  form.setAttribute('novalidate', '');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailContent = emailInput.value;
    const [emailValid, error] = emailValidator(emailContent);

    if (!emailValid) {
      if (error) errorField.textContent = error;
      submitButton.disabled = true;
      const img = document.createElement('img');
      img.src = '/img/caution.svg';
      img.alt = 'Caution';
      img.className = 'w-16 h-16';
      submitButton.appendChild(img);
      return;
    }

    form.submit();
  });

  const cooldownPeriod = Number(emailInput.getAttribute('data-wait-time'));

  if (waitTimeElement) {
    countdown(cooldownPeriod, waitTimeElement, () => {
      errorField.textContent = '';
      submitButton.disabled = false;
      submitButton.querySelector('img')?.remove();
    });
  }
});
