import * as dotenv from 'dotenv'
import { defineConfig } from 'cypress'

dotenv.config({ path: __dirname + '/.env' })

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    saveJson: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'results',
    reportTitle: 'SSO Siteminder Tests',
    overwrite: false,
  },
  e2e: {
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    retries: 0,
    specPattern: 'cypress/e2e/**.spec.ts',
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })
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
