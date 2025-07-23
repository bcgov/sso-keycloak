import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const privateKey = fs.readFileSync('./sso-cronjobs-siteminder-tests.2025-07-22.private-key.pem', 'utf8');

async function runTests(octokit, environment) {
  await octokit.rest.actions.createWorkflowDispatch({
    owner: 'bcgov',
    repo: 'sso-keycloak',
    workflow_id: 'siteminder-tests.yml',
    ref: 'SSOTEAM-2386',
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
      installationId: 77187483
    }
  });

  await octokit.rest.apps.getAuthenticated();

  await runTests(octokit, 'DEV');
}

main();
