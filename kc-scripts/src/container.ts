import _ from 'lodash';
import prompts from 'prompts';
import { Env, getAdminClient } from 'core';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

export const handleError = (error: any) => {
  if (error.isAxiosError) {
    console.error((error.response && error.response.data) || error);
  } else {
    console.error(error);
  }
};

interface EnvMeta {
  env: string;
  allowed?: string[];
  auto?: boolean;
}

export function createContainer(auto: boolean): (script: () => Promise<void>) => void;
export function createContainer(env1: string): (script: () => Promise<void>) => void;
export function createContainer(env1: string, env2: string): (script: () => Promise<void>) => void;
export function createContainer(env1: EnvMeta): (script: () => Promise<void>) => void;
export function createContainer(env1: EnvMeta, env2: string): (script: () => Promise<void>) => void;
export function createContainer(env1: string, env2: EnvMeta): (script: () => Promise<void>) => void;
export function createContainer(env1: EnvMeta, env2: EnvMeta): (script: () => Promise<void>) => void;
export function createContainer(arg1: boolean | string | EnvMeta, arg2?: string | EnvMeta) {
  return (script: (adminClient1?: KeycloakAdminClient, adminClient2?: KeycloakAdminClient) => Promise<void>) => {
    const starttime = new Date().getTime();

    const showExecTime = () => {
      const endtime = new Date().getTime();
      console.log(`Execution time: ${(endtime - starttime) / 1000} sec.`);
    };

    const run = async () => {
      let adminClient1!: KeycloakAdminClient | undefined;
      let adminClient2!: KeycloakAdminClient | undefined;

      let confirmClient1 = true;
      let confirmClient2 = true;

      if (_.isBoolean(arg1)) {
        await confirm(`Are you sure to proceed?`);
      } else if (_.isString(arg1)) {
        adminClient1 = await getAdminClient(arg1 as Env);
      } else {
        if (arg1.allowed && !arg1.allowed.includes(arg1.env)) {
          console.log(`invalid environment ${arg1.env}`);
          process.exit(1);
        }

        confirmClient1 = arg1.auto !== true;
        adminClient1 = await getAdminClient(arg1.env as Env);
      }

      if (!_.isNil(arg2)) {
        if (_.isString(arg2)) {
          adminClient2 = await getAdminClient(arg2 as Env);
        } else {
          if (arg2.allowed && !arg2.allowed.includes(arg2.env)) {
            console.log(`invalid environment ${arg2.env}`);
            process.exit(1);
          }

          confirmClient2 = arg2.auto !== true;
          adminClient2 = await getAdminClient(arg2.env as Env);
        }
      }

      const confirmations: KeycloakAdminClient[] = [];
      if (confirmClient1 && adminClient1) confirmations.push(adminClient1);
      if (confirmClient2 && adminClient2) confirmations.push(adminClient2);

      for (let x = 0; x < confirmations.length; x++) {
        const kcClient = confirmations[x];
        await confirm(`Are you sure to proceed in ${kcClient?.baseUrl}?`);
      }

      script(adminClient1, adminClient2)
        .then(() => {
          showExecTime();
          process.exit(0);
        })
        .catch((err) => {
          handleError(err);
          showExecTime();
          process.exit(1);
        });
    };

    run();
  };
}

async function confirm(message: string) {
  const res = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: false,
  });

  if (!res.value) {
    process.exit(0);
  }
}
