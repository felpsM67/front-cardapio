import { apiClient } from "../api/apiClient";
import type { Permission, Role } from "../models";

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
    description: cargo.descricao ?? "",
    permissions: cargo.permissoes ?? [],
  };
}

export const roleService = {
  async getAll(): Promise<Role[]> {
    const cargos = await apiClient.get<ApiCargo[]>(
      "/cargos",
      true,
    );

    return cargos.map(mapCargo);
  },

  async getById(id: string): Promise<Role> {
    const cargo = await apiClient.get<ApiCargo>(
      `/cargos/${id}`,
      true,
    );

    return mapCargo(cargo);
  },

  async create(data: CreateRoleDTO): Promise<Role> {
    const cargo = await apiClient.post<ApiCargo>(
      "/cargos",
      {
        nome: data.name.trim(),
        descricao: data.description.trim() || null,
        permissoes: data.permissions,
        ativo: true,
      },
      true,
    );

    return mapCargo(cargo);
  },

  async update(
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
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(
      `/cargos/${id}`,
      true,
    );
  },
};