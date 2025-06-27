import { errors, otpValidator, otpValidDigits } from 'src/utils/shared';
import {countdown, createResendCodeForm, getUID} from './shared';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('otp-form') as HTMLFormElement;
  const errorEl = document.getElementById('otp-error');
  const waitTimeElement = document.getElementById('wait-time-text') as HTMLElement | null;
  const codeContainer = document.getElementById('new-code-text');

  if (!form || !errorEl) return;

  const digitInputs: (HTMLInputElement)[] = [];

  for (let i = 1; i <= 6; i++) {
    const digitInput = document.getElementById(`code-digit-${i}`);
    if (!digitInput) return;
    digitInputs.push(document.getElementById(`code-digit-${i}`) as HTMLInputElement);
  }

  digitInputs.forEach((input, i) => {
    if (!input) return;

    input.addEventListener('beforeinput', (e) => {
      e.preventDefault();
      const value = e.data;
      if (!value) return;

      if (!otpValidDigits.includes(value)) {
        errorEl.innerText = errors.OTP_TYPES;
        (e.target as HTMLInputElement)?.focus();
        return;
      };

      errorEl.innerText = "";
      (e.target as HTMLInputElement).value = value;
      const nextInput = digitInputs[i + 1];
      if (nextInput) nextInput.focus();
      else {
        const codes = digitInputs.map(input => input.value);
        const [, error] = otpValidator(codes);
        if (error) errorEl.innerText = error as string;
        else form.submit();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData)?.getData('text');
      if (!pasted) return;

      const [, error] = otpValidator(pasted.split(''));
      if (error) {
        errorEl.innerText = error as string;
        return
      }

      pasted.split('').forEach((digit, i) => (digitInputs[i].value = digit));
      if (pasted.length === 6) form.submit();
      else {
        digitInputs[pasted.length].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '') {
        e.preventDefault();
        if (i > 0) {
          digitInputs[i - 1].value = '';
          digitInputs[i - 1].focus();
        }
      }
    });
  });

  const cooldownPeriod = Number(errorEl.getAttribute('data-wait-time'));

  if (waitTimeElement && codeContainer)
    countdown(cooldownPeriod, waitTimeElement, () => {
      const uid = getUID();
      document.getElementById('wait-text')?.remove();
      const submitForm = createResendCodeForm(uid, 'link');
      codeContainer.appendChild(submitForm);
    });
});
