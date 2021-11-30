const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
const { env, totp } = argv;

const customRealms = [
  // {
  //   realm: <realm_name>,
  //   idir1: <po_idir>,
  //   idir2: <tl_idir>,
  // }
];

async function main() {
  if (!env) {
    console.info(`
    Usages:
      node keycloak-realm-admins.js --env <env> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to proceed in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    const realms = await kcAdminClient.realms.find({});
    const realmNames = realms.map((realm) => realm.realm);

    const nonExist = [];
    const noAdminGroup = [];
    const notAssigned = [];

    await Promise.all(
      customRealms.map(async (item) => {
        if (!realmNames.includes(item.realm)) {
          nonExist.push(item.realm);
          return;
        }

        const groups = await kcAdminClient.groups.find({ realm: item.realm });
        const adminGroup = groups.find((group) => group.name === 'Realm Administrator');
        if (!adminGroup) {
          noAdminGroup.push(item.realm);
          return;
        }

        if (adminGroup) {
          const users = await kcAdminClient.groups.listMembers({ realm: item.realm, id: adminGroup.id });
          const adminIdirs = [item.idir1.toLocaleLowerCase(), item.idir2.toLocaleLowerCase()];
          const userIdirs = users.map((user) => user.username.split('@idir')[0].toLocaleLowerCase());
          const adminsExist = adminIdirs.every((userid) => userIdirs.includes(userid));

          if (!adminsExist) {
            notAssigned.push({ realm: item.realm, adminIdirs, userIdirs });
            return;
          }
        }
      }),
    );

    console.log('Realms do not exist ===');
    _.each(nonExist, (v) => {
      console.log(v);
    });

    console.log('Realms do not have admin group ===');
    _.each(noAdminGroup, (v) => {
      console.log(v);
    });

    console.log('Realms do not have all admin users from realm registry ===');
    _.each(notAssigned, (v) => {
      console.log('===========================================');
      console.log('Realm:', v.realm);
      console.log('PO & Tech:', v.adminIdirs.join(', '));
      console.log('All Users:', v.userIdirs.join(', '));
      console.log('===========================================');
    });
  } catch (err) {
    console.error(err);
  }
}

main();
