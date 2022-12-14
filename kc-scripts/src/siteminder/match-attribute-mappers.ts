import fs from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { handleError } from 'container';
import { getAdminClient, Env } from 'core';
import { getRealmNameFromLoginUrl, getClientEnvFromLoginUrl } from 'helpers/realm';
import { getSamlAttributes } from './get-saml-attributes';

const argv = yargs(process.argv.slice(2))
  .options({
    totp: { type: 'string', default: '' },
  })
  .parseSync();

const { totp } = argv;

async function match(env: Env, realm: string, attributes: string[]) {
  const adminClient = await getAdminClient(env, { totp });
  if (!adminClient || !realm) return;

  // @ts-ignore
  const idps = await adminClient.identityProviders.find({ realm });
  const idp = idps[0];

  const mappers = await adminClient.identityProviders.findMappers({ realm, alias: idp.alias as string });
  const result = [];

  for (let x = 0; x < attributes.length; x++) {
    const attribute = attributes[x];
    let mapper = mappers.find((v) => v.config['attribute.name'] === attribute);
    if (mapper) result.push(`${attribute} -> ${mapper.config['user.attribute']}`);
    else {
      mapper = mappers.find(
        (v) =>
          v.identityProviderMapper === 'saml-username-idp-mapper' &&
          v.config.template.includes(`{ATTRIBUTE.${attribute}}`),
      );
      if (mapper) result.push(`${attribute} -> username mapper`);
      else result.push(`${attribute} -> no mapper found.`);
    }
  }

  return result;
}

const tasks = [
  { url: 'https://oidc.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_basic' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_business' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_basic' },
  { url: 'https://oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_business' },

  { url: 'https://test.oidc.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_basic' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_business' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_basic' },
  { url: 'https://test.oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_business' },

  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_basic' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceidbasicbusiness/console/', userType: 'bceid_business' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_basic' },
  { url: 'https://dev.oidc.gov.bc.ca/auth/admin/_bceid/console/', userType: 'bceid_business' },

  { url: 'https://loginproxy.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://loginproxy.gov.bc.ca/auth/admin/bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://loginproxy.gov.bc.ca/auth/admin/bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_basic' },
  { url: 'https://loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_business' },

  { url: 'https://test.loginproxy.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://test.loginproxy.gov.bc.ca/auth/admin/bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://test.loginproxy.gov.bc.ca/auth/admin/bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://test.loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_basic' },
  { url: 'https://test.loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_business' },

  { url: 'https://dev.loginproxy.gov.bc.ca/auth/admin/idir/console/', userType: 'idir' },
  { url: 'https://dev.loginproxy.gov.bc.ca/auth/admin/bceidbasic/console/', userType: 'bceid_basic' },
  { url: 'https://dev.loginproxy.gov.bc.ca/auth/admin/bceidbusiness/console/', userType: 'bceid_business' },
  { url: 'https://dev.loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_basic' },
  { url: 'https://dev.loginproxy.gov.bc.ca/auth/admin/bceidboth/console/', userType: 'bceid_business' },
];

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

async function run({ url, userType }: { url: string; userType: string }) {
  console.log(`running ${url} with ${userType}`);
  const clientEnv = getClientEnvFromLoginUrl(url);
  const attributeKeys = await getSamlAttributes(url, userType);
  const realm = getRealmNameFromLoginUrl(url);
  const compare = await match(clientEnv as Env, realm, attributeKeys);
  return { url, clientEnv, userType, compare: compare || [] };
}
async function main() {
  try {
    const result: { url: string; clientEnv: string; userType: string; compare: string[] }[] = [];

    for (let x = 0; x < tasks.length; x++) {
      const output = await run(tasks[x]);
      result.push(output);
    }

    fs.writeFileSync(path.resolve(__dirname, `result.json`), JSON.stringify(result, null, 2));

    while (result.some((v) => v.compare.length === 0)) {
      for (let x = 0; x < result.length; x++) {
        const res = await result[x];
        if (res.compare.length > 0) continue;

        const output = await run({ url: res.url, userType: res.userType });
        result[x].compare = output.compare;
      }
    }

    fs.writeFileSync(path.resolve(__dirname, `result.json`), JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
