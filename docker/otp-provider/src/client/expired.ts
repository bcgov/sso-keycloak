import { countdown, createResendCodeForm, getUID } from './shared';

document.addEventListener('DOMContentLoaded', () => {
  const waitTimeElement = document.getElementById('wait-time-text') as HTMLElement | null;
  const waitTimeContainer = document.getElementById('wait-text') as HTMLElement | null;

  if (!waitTimeElement || !waitTimeContainer) return;

  const cooldownPeriod = Number(waitTimeElement.getAttribute('data-wait-time'));
  countdown(cooldownPeriod, waitTimeElement, () => {
    const uid = getUID();
    const resendButton = createResendCodeForm(uid, 'btn');
    waitTimeContainer.innerHTML = "";
    waitTimeContainer.appendChild(resendButton);
  });
});
