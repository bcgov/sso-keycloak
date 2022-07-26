'use strict';

module.exports = {
  timeout: 20000,
  diff: false,
  reporter: 'mochawesome',
  'reporter-option': ['reportDir=results', 'reportFilename=siteminder-test', 'html=false'],
};
