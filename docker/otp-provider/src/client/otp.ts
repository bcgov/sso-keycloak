import { errors, otpValidator, otpValidDigits } from 'src/utils/shared';
import { countdown, createResendCodeForm, getUID, clearFormError, setFormError } from './shared';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('otp-form') as HTMLFormElement;
  const errorEl = document.getElementById('otp-error');
  const waitTimeElement = document.getElementById('wait-time-text') as HTMLElement | null;
  const codeContainer = document.getElementById('new-code-text');
  const loginButton = document.getElementById('login-button') as HTMLButtonElement;
  if (!form || !errorEl) return;

  form.setAttribute('novalidate', '');
  const digitInputs: HTMLInputElement[] = [];

  for (let i = 1; i <= 6; i++) {
    const digitInput = document.getElementById(`code-digit-${i}`);
    if (!digitInput) return;
    digitInputs.push(document.getElementById(`code-digit-${i}`) as HTMLInputElement);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const codes = digitInputs.map((input) => input.value).filter((val) => val !== '');
    const [, error] = otpValidator(codes);
    if (error) {
      setFormError(errorEl, loginButton, error as string);
      const firstEmptyInput = digitInputs.find((input) => input?.value === '');
      if (firstEmptyInput) firstEmptyInput.focus();
      else digitInputs[0].focus();
    } else {
      loginButton.disabled = true;
      form.submit();
    }
  });

  digitInputs.forEach((input, i) => {
    if (!input) return;

    input.addEventListener('beforeinput', (e) => {
      e.preventDefault();
      const value = e.data;
      if (!value) return;

      clearFormError(errorEl, loginButton);
      if (!otpValidDigits.includes(value)) {
        setFormError(errorEl, loginButton, errors.OTP_TYPES);
        (e.target as HTMLInputElement)?.focus();
        return;
      }

      (e.target as HTMLInputElement).value = value;
      const nextInput = digitInputs[i + 1];
      if (nextInput) nextInput.focus();
      else {
        const codes = digitInputs.map((input) => input.value);
        const [, error] = otpValidator(codes);
        if (error) setFormError(errorEl, loginButton, error as string);
        else form.requestSubmit();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData?.getData('text');
      if (!pasted) return;

      const validPastedChars = pasted.split('').filter((char) => otpValidDigits.includes(char));
      digitInputs.slice(i).forEach((input, k) => {
        if (validPastedChars[k]) input.value = validPastedChars[k];
      });

      const fullCode = digitInputs.map((input) => input.value).filter((val) => val !== '');
      if (fullCode.length < 6) {
        digitInputs[fullCode.length].focus();
        return;
      }

      const [, error] = otpValidator(fullCode);
      if (error) {
        setFormError(errorEl, loginButton, error as string);
        return;
      }

      form.requestSubmit();
    });

    input.addEventListener('keydown', (e) => {
      // beforeinput override blocks enter submission. Need to allow here
      if (e.key === 'Enter') {
        e.preventDefault();
        form.requestSubmit();
      }
      if (e.key === 'Backspace' && input.value === '') {
        e.preventDefault();
        clearFormError(errorEl, loginButton);
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
