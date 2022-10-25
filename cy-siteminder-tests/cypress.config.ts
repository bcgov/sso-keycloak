import * as dotenv from 'dotenv'
import { defineConfig } from 'cypress'

dotenv.config({ path: __dirname + '/.env' })

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'results',
    reportTitle: 'SSO Siteminder Tests',
  },
  e2e: {
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    retries: 1,
    specPattern: 'cypress/e2e/**.spec.ts',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      config.env = {
        ...process.env,
        ...config.env,
      }
      return config
    },
    video: false,
    videoUploadOnPasses: false,
  },
})
