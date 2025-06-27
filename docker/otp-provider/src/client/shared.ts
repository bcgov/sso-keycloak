/**
 * Function to add a countdown timer on the resend code message.
 * @param cooldownPeriod The amount of time to countdown
 * @param waitTimeElement HTML element to update timer
 * @param onComplete Callback function called when countdown ends
 * @returns void
 */
export const countdown = (cooldownPeriod: number, waitTimeElement: HTMLElement, onComplete: () => void) => {
  if (cooldownPeriod <= 0) return;
  let currentTime = cooldownPeriod;

  const countdownInterval = setInterval(() => {
    currentTime -= 1;
    if (currentTime === 0) {
      if (countdownInterval) clearInterval(countdownInterval);
      onComplete();
    }
    waitTimeElement.textContent = String(currentTime);
  }, 1000);
};

/**
 * Returns a form for resending the OTP. This could be an AJAX request, but is left as form for consistency with server-rendered content.
 * @param uid The transaction id
 * @param confirmEl Whether to style the confirmation element as a button or link
 * @returns HTML Form Element
 */
export const createResendCodeForm = (uid: string, confirmEl: 'btn' | 'link') => {
  const form = document.createElement('form');
  form.id = 'send-otp';
  form.action = `/interaction/${uid}/otp`;
  form.method = 'POST';
  form.autocomplete = 'off';
  if (confirmEl === 'link') form.classList = 'inline';
  if (confirmEl === 'btn') form.classList = 'w-full';

  const submitBtn = document.createElement('button');
  let classList = confirmEl;
  if (confirmEl === 'btn') classList += ' w-full';
  if (confirmEl === 'link') classList += ' inline';
  submitBtn.classList = classList;
  submitBtn.innerText = 'Resend code';

  form.appendChild(submitBtn);

  return form;
};

/**
 * Fetch the transaction ID from the url. Expected to be used on the OTP page for fetching new codes, e.g. <url>/<transactionId>/otp.
 * @returns Transaction ID
 */
export const getUID = () => location.pathname.split('/')[location.pathname.split('/').length - 2];
