// src/lib/firebase/services/roles.ts
import { cosmosClient } from '../../azure/config';
import { v4 as uuidv4 } from 'uuid';
import type { Role, Permission } from '../../types';

const ROLES_CONTAINER = 'roles';
const COSMOS_DATABASE_ID = process.env.AZURE_COSMOS_DATABASE_ID || '';

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const item: Role = {
    id,
    companyId,
    name,
    permissions,
    projectTypeIds,
    createdAt,
  };
  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(ROLES_CONTAINER);
  await container.items.create(item);
  return id;
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(ROLES_CONTAINER);
  const query = 'SELECT * FROM c WHERE c.companyId = @companyId';
  const parameters = [{ name: '@companyId', value: companyId }];
  const { resources } = await container.items.query({ query, parameters }).fetchAll();
  // Sort by name in application code
  return (resources as Role[]).sort((a, b) => a.name.localeCompare(b.name));
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(ROLES_CONTAINER);
  const { resource } = await container.item(roleId, roleId).read<Role>();
  return resource ?? null;
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(ROLES_CONTAINER);
  const { resource } = await container.item(roleId, roleId).read<Role>();
  if (!resource) throw new Error('Role not found');
  resource.permissions = permissions;
  resource.projectTypeIds = projectTypeIds;
  await container.items.upsert(resource);
}

  const container = cosmosClient.database(COSMOS_DATABASE_ID).container(ROLES_CONTAINER);
  // TODO: Before deleting a role, check if any users are assigned to it.
  await container.item(roleId, roleId).delete();
}
