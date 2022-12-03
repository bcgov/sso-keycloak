import _ from 'lodash';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import RoleRepresentation, { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { getIdpToUpstreamRealmMap } from 'helpers/realm';

interface RoleMapping {
  type: string;
  id: string;
  name: string;
  children: string[];
  group?: any;
  role?: any;
}

interface UserRoleMap {
  [key: string]: UserRepresentation & { roles: string[] };
}

interface RolesByName {
  [key: string]: RoleRepresentation;
}

export async function buildGroupMappings(
  adminClient: KeycloakAdminClient,
  { realm, excludes }: { realm: string; excludes: string[] } = { realm: '', excludes: [] },
) {
  const result: RoleMapping[] = [];
  const groups = await adminClient.groups.find({ realm });

  for (let x = 0; x < groups.length; x++) {
    const group = groups[x];
    if (excludes.includes(group.name as string)) continue;

    let roleMappings = await adminClient.groups.listRealmRoleMappings({
      realm,
      id: group.id as string,
    });

    roleMappings = roleMappings.filter((mapping) => !excludes.includes(mapping.name as string));

    result.push({
      type: 'group',
      id: group.id as string,
      name: group.name as string,
      children: roleMappings.map((mapping) => mapping.name) as string[],
    });
  }

  return result;
}

export async function buildRoleMappings(
  adminClient: KeycloakAdminClient,
  { realm, excludes }: { realm: string; excludes: string[] } = { realm: '', excludes: [] },
) {
  const result: RoleMapping[] = [];
  const roles = await adminClient.roles.find({ realm });

  for (let x = 0; x < roles.length; x++) {
    const role = roles[x];
    if (excludes.includes(role.name as string)) continue;

    let roleMappings = await adminClient.roles.getCompositeRolesForRealm({ realm, id: role.id as string });
    roleMappings = roleMappings.filter((mapping) => !excludes.includes(mapping.name as string));

    result.push({
      type: 'role',
      id: role.id as string,
      name: role.name as string,
      children: roleMappings.map((mapping) => mapping.name) as string[],
    });
  }

  return result;
}

export async function buildGroupRoleMappings(
  adminClient: KeycloakAdminClient,
  { realm, excludes }: { realm: string; excludes: string[] } = { realm: '', excludes: [] },
) {
  const [groups, roles] = await Promise.all([
    buildGroupMappings(adminClient, { realm, excludes }),
    buildRoleMappings(adminClient, { realm, excludes }),
  ]);

  const duplicates = groups.filter((group) => roles.findIndex((role) => group.name === role.name));
  if (duplicates.length > 0) {
    console.log('duplicate role names', JSON.stringify(_.map(duplicates, 'name'), null, 2));
  }

  const roleMappings: RoleMapping[] = ([] = [...groups, ...roles]);

  const mergedRoleMappings = mergeRoleMappings(roleMappings);

  return { roleMappings, mergedRoleMappings, duplicates };
}

export async function buildUserRolesMap(
  adminClient: KeycloakAdminClient,
  { realm, roleMappings }: { realm: string; roleMappings: RoleMapping[] } = { realm: '', roleMappings: [] },
) {
  const result: UserRoleMap = {};

  for (let x = 0; x < roleMappings.length; x++) {
    const roleMapping = roleMappings[x];

    const users =
      roleMapping.type === 'group'
        ? await adminClient.groups.listMembers({ realm, id: roleMapping.id })
        : await adminClient.roles.findUsersWithRole({ realm, name: roleMapping.name });

    for (let y = 0; y < users.length; y++) {
      const user = users[y];
      if (!result[user.id as string]) result[user.id as string] = { ...user, roles: [] };
      result[user.id as string].roles.push(roleMapping.name);
    }
  }

  return result;
}

export function mergeRoleMappings(roleMappings: RoleMapping[]) {
  const mappingsByName = _.groupBy(roleMappings, 'name');
  const merged = _.mapValues(mappingsByName, (val, key) => {
    if (val.length > 1) {
      const group = val.find((v) => v.type === 'group') as RoleMapping;
      const role = val.find((v) => v.type === 'role') as RoleMapping;

      return {
        type: 'merged',
        name: group.name,
        group,
        role,
        children: [...group.children, ...role.children],
      };
    }

    return val[0];
  });

  return _.values(merged) as RoleMapping[];
}

export async function createClientRoles(
  adminClient: KeycloakAdminClient,
  { realm, clientId, roleMappings }: { realm: string; clientId: string; roleMappings: RoleMapping[] } = {
    realm: '',
    clientId: '',
    roleMappings: [],
  },
) {
  const result: RolesByName = {};

  for (let x = 0; x < roleMappings.length; x++) {
    const roleMapping = roleMappings[x];

    let role = await adminClient.clients.findRole({
      realm,
      id: clientId,
      roleName: roleMapping.name,
    });

    if (!role) {
      await adminClient.clients.createRole({
        id: clientId,
        realm,
        name: roleMapping.name,
        composite: roleMapping.children.length > 0,
        clientRole: true,
        containerId: clientId,
      });

      role = await adminClient.clients.findRole({
        realm,
        id: clientId,
        roleName: roleMapping.name,
      });
    }

    result[roleMapping.name] = role;
  }

  return result;
}

export async function createCompositeRoles(
  adminClient: KeycloakAdminClient,
  { realm, clientId, roleMappings }: { realm: string; clientId: string; roleMappings: RoleMapping[] } = {
    realm: '',
    clientId: '',
    roleMappings: [],
  },
) {
  for (let x = 0; x < roleMappings.length; x++) {
    const roleMapping = roleMappings[x];

    const role = await adminClient.clients.findRole({
      realm,
      id: clientId,
      roleName: roleMapping.name,
    });

    const rolesToDel = await adminClient.roles.getCompositeRolesForClient({
      realm,
      clientId,
      id: role.id as string,
    });

    const rolesToAdd = await Promise.all(
      roleMapping.children.map((roleName) =>
        adminClient.clients.findRole({
          realm,
          id: clientId,
          roleName,
        }),
      ),
    );

    // remove existing ones first before adding composite roles
    await adminClient.roles.delCompositeRoles({ realm, id: role.id as string }, rolesToDel);
    await adminClient.roles.createComposite({ realm, roleId: role.id as string }, rolesToAdd);
  }
}

export async function assignUserToRealmRole(
  adminClient: KeycloakAdminClient,
  {
    realm,
    userId,
    roleName,
  }: {
    realm: string;
    userId: string;
    roleName: string;
  } = {
    realm: '',
    userId: '',
    roleName: '',
  },
) {
  let role = await adminClient.roles.findOneByName({ realm, name: roleName });

  if (!role) {
    await adminClient.roles.create({
      realm,
      name: roleName,
      clientRole: false,
      containerId: realm,
    });

    role = await adminClient.roles.findOneByName({ realm, name: roleName });
  }

  const roleMapping: RoleMappingPayload = { id: role?.id as string, name: role?.name as string };
  await adminClient.users.addRealmRoleMappings({ realm, id: userId, roles: [roleMapping] });
}

export async function createTargetUserRoleBindings(
  adminClient: KeycloakAdminClient,
  {
    realm,
    client,
    userRolesMap,
    rolesMap,
    baseTargetUserIds,
  }: {
    realm: string;
    client: ClientRepresentation;
    userRolesMap: UserRoleMap;
    rolesMap: RolesByName;
    baseTargetUserIds: { baseUserId: string; targetUserId: string }[];
  } = {
    realm: '',
    client: {},
    userRolesMap: {},
    rolesMap: {},
    baseTargetUserIds: [],
  },
) {
  for (let x = 0; x < baseTargetUserIds.length; x++) {
    const { baseUserId, targetUserId } = baseTargetUserIds[x];

    const roleMapping = {
      realm,
      id: targetUserId,
      clientUniqueId: client.id as string,
    };

    const roleNames = userRolesMap[baseUserId].roles;
    const roles: RoleMappingPayload[] = roleNames.map((roleName) => {
      const { id, name } = rolesMap[roleName];
      return { id, name } as RoleMappingPayload;
    });

    const roleMappingUpdate = { ...roleMapping, roles };

    await adminClient.users.addClientRoleMappings(roleMappingUpdate);
    await assignUserToRealmRole(adminClient, { realm, userId: targetUserId, roleName: `client-${client.clientId}` });
  }
}

export async function matchTargetUsers(
  baseAdminClient: KeycloakAdminClient,
  targetAdminClient: KeycloakAdminClient,
  {
    baseRealm,
    targetRealm,
    baseUsers,
  }: {
    baseRealm: string;
    targetRealm: string;
    baseUsers: UserRepresentation[];
  } = {
    baseRealm: '',
    targetRealm: '',
    baseUsers: [],
  },
) {
  const parentToGuidKeyMap: { [key: string]: string } = {
    idir: 'idir_userid',
    _bceid: 'bceid_userid',
    _bceidbasic: 'bceid_userid',
    _bceidbasicbusiness: 'bceid_userid',
    _bceidbusiness: 'bceid_userid',
  };

  const parentToGoldIdpKeyMap: { [key: string]: string } = {
    idir: 'idir',
    _bceid: 'bceidboth',
    _bceidbasic: 'bceidbasic',
    _bceidbasicbusiness: 'bceidboth',
    _bceidbusiness: 'bceidbusiness',
  };

  const idpToUpstreamRealmMap = await getIdpToUpstreamRealmMap(baseAdminClient, baseRealm);

  const result: { [key: string]: any[] } = {
    found: [],
    'no-idp': [],
    'no-guid': [],
    'valid-base-target-users': [],
  };

  for (let x = 0; x < baseUsers.length; x++) {
    const buser = baseUsers[x];
    const links = await baseAdminClient.users.listFederatedIdentities({
      realm: baseRealm,
      id: buser.id as string,
    });

    if (links.length === 0) {
      result['no-idp'].push(buser.username as string);
      continue;
    }

    const { identityProvider, userId } = links[0];

    const parentRealmName = idpToUpstreamRealmMap[identityProvider as string];
    if (!parentRealmName) continue;

    const parentUser = (await baseAdminClient.users.findOne({
      realm: parentRealmName,
      id: userId as string,
    })) as UserRepresentation;

    const buserGuid = _.get(parentUser, `attributes.${parentToGuidKeyMap[parentRealmName]}.0`);

    if (!buserGuid) {
      result['no-guid'].push(buser.username);
      continue;
    }

    const targetUsername = `${_.toLower(buserGuid)}@${parentToGoldIdpKeyMap[parentRealmName]}`;
    let tusers = await targetAdminClient.users.find({
      realm: targetRealm,
      username: targetUsername,
      exact: true,
    });
    tusers = tusers.filter((v) => v.username === targetUsername);

    if (tusers.length === 0) {
      const key = `not-found-${identityProvider}`;
      const keyParent = `not-found-${identityProvider}-parent`;

      if (!result[key]) result[key] = [];
      if (!result[keyParent]) result[keyParent] = [];

      result[key].push(buser.username);
      result[keyParent].push(parentUser.username as string);
    } else {
      result['found'].push(buser.username);
      result['valid-base-target-users'].push({ baseUserId: buser.id, targetUserId: tusers[0].id });
    }
  }

  return result;
}
