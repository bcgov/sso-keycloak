const _ = require('lodash');
const { handleError, ignoreError } = require('../../helpers');

const migrateSilverGithubToGoldStandard = async (baseAdminClient, targetAdminClient, githubUsernames) => {
  const logPrefix = 'MIGRATE SILVER GITHUB TO GOLD STANDARD: ';
  if (!baseAdminClient || !targetAdminClient) return;

  for (let x = 0; x < githubUsernames.length; x++) {
    const username = githubUsernames[x];

    try {
      const baseGithubUsers = await baseAdminClient.users.find({ realm: '_github', username, max: 1 });
    } catch (err) {
      console.error(`${logPrefix}error with: ${username}`);
      handleError(err);
    }
  }
};
