'use strict';

module.exports = {
  timeout: 60000,
  diff: false,
  reporter: 'mochawesome',
  'reporter-option': ['reportDir=results', 'reportFilename=siteminder-test', 'html=false'],
};
