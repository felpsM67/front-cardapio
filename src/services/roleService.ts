import { apiClient } from '../api/apiClient';
import {
  PREDEFINED_ROLES,
  normalizeRoleName,
} from '../constants/predefinedRoles';
import type { Permission, Role } from '../models';

interface ApiCargo {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: Permission[] | null;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateRoleDTO {
  name: string;
  description: string;
  permissions: Permission[];
}

function mapCargo(cargo: ApiCargo): Role {
  return {
    id: String(cargo.id),
    name: cargo.nome,
    description: cargo.descricao ?? '',
    permissions: cargo.permissoes ?? [],
  };
}

function normalizePermissions(permissions: Permission[]): Permission[] {
  return [...new Set(permissions)].sort();
}

function hasSamePermissions(
  currentPermissions: Permission[],
  expectedPermissions: Permission[],
): boolean {
  const current = normalizePermissions(currentPermissions);
  const expected = normalizePermissions(expectedPermissions);

  return (
    current.length === expected.length &&
    current.every((permission, index) => permission === expected[index])
  );
}

async function getAllRoles(): Promise<Role[]> {
  const cargos = await apiClient.get<ApiCargo[]>('/cargos', true);
  return cargos.map(mapCargo);
}

async function createRole(data: CreateRoleDTO): Promise<Role> {
  const cargo = await apiClient.post<ApiCargo>(
    '/cargos',
    {
      nome: data.name.trim(),
      descricao: data.description.trim() || null,
      permissoes: data.permissions,
      ativo: true,
    },
    true,
  );

  return mapCargo(cargo);
}

async function updateRole(
  id: string,
  data: Partial<CreateRoleDTO>,
): Promise<Role> {
  const cargo = await apiClient.put<ApiCargo>(
    `/cargos/${id}`,
    {
      nome: data.name?.trim(),
      descricao:
        data.description !== undefined
          ? data.description.trim() || null
          : undefined,
      permissoes: data.permissions,
    },
    true,
  );

  return mapCargo(cargo);
}

export const roleService = {
  getAll: getAllRoles,

  async getById(id: string): Promise<Role> {
    const cargo = await apiClient.get<ApiCargo>(`/cargos/${id}`, true);
    return mapCargo(cargo);
  },

  create: createRole,

  update: updateRole,

  async ensurePredefined(): Promise<Role[]> {
    const existingRoles = await getAllRoles();
    const synchronizedRoles: Role[] = [];

    for (const predefinedRole of PREDEFINED_ROLES) {
      const existingRole = existingRoles.find(
        (role) =>
          normalizeRoleName(role.name) ===
          normalizeRoleName(predefinedRole.name),
      );

      if (!existingRole) {
        synchronizedRoles.push(await createRole(predefinedRole));
        continue;
      }

      const needsUpdate =
        existingRole.description.trim() !== predefinedRole.description ||
        !hasSamePermissions(
          existingRole.permissions,
          predefinedRole.permissions,
        );

      if (needsUpdate) {
        synchronizedRoles.push(
          await updateRole(existingRole.id, predefinedRole),
        );
        continue;
      }

      synchronizedRoles.push(existingRole);
    }

    return synchronizedRoles;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/cargos/${id}`, true);
  },
};
