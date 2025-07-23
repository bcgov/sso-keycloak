import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const privateKey = fs.readFileSync('./github-siteminder-tests-private-key.pem', 'utf8');

async function runTests(octokit, environment) {
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
}

async function main() {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GH_SITMINDER_TESTS_APP_ID,
      privateKey,
      installationId: process.env.GH_SITMINDER_TESTS_INSTALLATION_ID
    }
  });

  await octokit.rest.apps.getAuthenticated();

  await runTests(octokit, 'DEV');

  await runTests(octokit, 'TEST');

  if (new Date().getDay() === 0) await runTests(octokit, 'PROD');
}

main();
