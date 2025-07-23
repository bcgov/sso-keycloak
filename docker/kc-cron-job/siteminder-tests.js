import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';
import fs from 'fs';
import { sendRcNotification } from './helpers.js';

dotenv.config();

const privateKey = fs.readFileSync('./github-siteminder-tests-private-key.pem', 'utf8');

async function runTests(octokit, environment) {
  try {
    await octokit.rest.actions.createWorkflowDispatch({
      owner: 'bcgov',
      repo: 'sso-keycloak',
      workflow_id: 'siteminder-tests.yml',
      ref: 'dev',
      inputs: {
        environment,
        cluster: 'GOLD'
      }
    });
  } catch (err) {
    console.error(err);
    await sendRcNotification(
      'siteminder-tests',
      `**[${environment}]Failed to trigger siteminder tests** \n\n` + JSON.stringify(err),
      true
    );
  }
}

async function main() {
  try {
    let octokit;
    try {
      octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: process.env.GH_SITMINDER_TESTS_APP_ID,
          privateKey,
          installationId: process.env.GH_SITMINDER_TESTS_INSTALLATION_ID
        }
      });

      await octokit.rest.apps.getAuthenticated();
    } catch (err) {
      console.error(err);
      throw new Error('Failed to authenticate with github application');
    }

    await runTests(octokit, 'DEV');

    await runTests(octokit, 'TEST');

    if (new Date().getDay() === 0) await runTests(octokit, 'PROD');
  } catch (err) {
    console.error(err);
    await sendRcNotification('siteminder-tests', `**${err}** \n\n` + JSON.stringify(err), true);
  }
}

main();
