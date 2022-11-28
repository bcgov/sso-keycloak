document.addEventListener('DOMContentLoaded', function (event) {
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
  const icons = document.getElementsByClassName('kc-social-icon');
  for (var x = 0; x < icons.length; x++) {
    var elem = icons[x];
    var content = elem.getAttribute('data-tooltip');

    if (content) {
      tippy(elem, {
        content,
        allowHTML: true,
        hideOnClick: false,
        delay: [100, 100],
        interactive: true,
      });
    }
  }
}
