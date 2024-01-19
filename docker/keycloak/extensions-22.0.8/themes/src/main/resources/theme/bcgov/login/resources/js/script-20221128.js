document.addEventListener('DOMContentLoaded', function (event) {
  // restart login
  forceRestartLogin();
  // use gov icon for tab:
  updateFavIcon();

  const errorElem = document.getElementById('kc-error-message');
  const titleContent = errorElem ? 'Login Error:' : 'Authenticate with:';
  document.getElementById('kc-page-title').innerHTML = titleContent;

  addTooltips();

  if (titleContent === 'Login Error:') {
    if (
      document.getElementsByClassName('login-err-username')[0] &&
      document.getElementsByClassName('instruction-link')[0]
    ) {
      const pageURLQueryParams = new URLSearchParams(window.location.search);

      const pageURLQueryParamsObject = {};

      for (const [key, value] of pageURLQueryParams) {
        pageURLQueryParamsObject[key] = value;
      }

      document.getElementsByClassName(
        'instruction-link',
      )[0].href = `${window.location.protocol}//${window.location.host}/auth/realms/standard/login-actions/restart?client_id=${pageURLQueryParamsObject?.client_id}&tab_id=${pageURLQueryParamsObject?.tab_id}`;

      // Replace the username with the identity provider alias
      const usernameRegex = /<[\w\d]+@(\w+)>/g;

      const loginErrorString = document.getElementsByClassName('login-err-username')[0].innerText;

      const updatedDifferentUserAuthenticatedMessage = loginErrorString.replace(
        usernameRegex,
        (match, capturedGroup) => {
          // If a match is found, replace it with the captured group
          // Otherwise, return the original match
          return capturedGroup || match;
        },
      );

      document.getElementsByClassName('login-err-username')[0].innerText = updatedDifferentUserAuthenticatedMessage;
    }
  }
});

function updateFavIcon() {
  var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = 'https://portal.nrs.gov.bc.ca/nrs-portal-theme/images/favicon.ico';
  document.getElementsByTagName('head')[0].appendChild(link);
}

function addTooltips() {
  const tooltips = document.getElementsByClassName('tooltiptext');
  for (var x = 0; x < tooltips.length; x++) {
    var elem = tooltips[x];
    var content = elem.textContent;

    if (content) {
      elem.innerHTML = content;
    }
  }
}

function forceRestartLogin() {
  var restartLoginLink = document.getElementById('reset-login');
  var otpInput = document.getElementById('otp');
  if (restartLoginLink && !otpInput) {
    window.location.href = restartLoginLink.href;
  }
}
