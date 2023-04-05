document.addEventListener('DOMContentLoaded', function (event) {
  // restart login
  forceRestartLogin();
  // use gov icon for tab:
  updateFavIcon();

  const errorElem = document.getElementById('kc-error-message');
  const titleContent = errorElem ? 'Login Error:' : 'Authenticate with:';
  document.getElementById('kc-page-title').innerHTML = titleContent;

  addTooltips();
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
