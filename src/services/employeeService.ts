import type { Employee, EmployeeStatus } from "../models";
import { apiClient } from "../api/apiClient";

interface EmployeeApiResponse {
  id?: number | string;
  nome?: string;
  name?: string;
  telefone?: string | null;
  phone?: string;
  ativo?: boolean;
  status?: EmployeeStatus;
  cargoId?: number | string | null;
  roleId?: number | string | null;
  userId?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: number | string;
    nome?: string;
    name?: string;
    email?: string;
    password?: string;
  };
  email?: string;
  password?: string;
}

function mapEmployee(item: EmployeeApiResponse): Employee {
  return {
    id: String(item.id ?? ''),
    storeId: '',
    name: item.nome ?? item.name ?? item.user?.nome ?? item.user?.name ?? '',
    email: item.user?.email ?? item.email ?? '',
    password: item.user?.password ?? item.password ?? '',
    phone: item.telefone ?? item.phone ?? '',
    roleId: String(item.cargoId ?? item.roleId ?? ''),
    status: item.ativo === false || item.status === 'inactive' ? 'inactive' : 'active',
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
  };
}

export interface CreateEmployeeData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  roleId?: string | number;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  roleId?: string | number;
  status?: EmployeeStatus;
}

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const employees = await apiClient.get<EmployeeApiResponse[]>(
      "/funcionarios",
      true,
    );

    return employees.map(mapEmployee);
  },

  async getAllForStore(
    _storeId: string,
  ): Promise<Employee[]> {
    return this.getAll();
  },

  async create(
    data: CreateEmployeeData,
  ): Promise<Employee> {
    const roleId = Number(data.roleId ?? 0);

    const employee = await apiClient.post<EmployeeApiResponse>(
      "/funcionarios",
      {
        nome: data.name?.trim() ?? "",
        email: data.email?.trim().toLowerCase() ?? "",
        senha: data.password ?? "",
        telefone: data.phone?.trim() ?? "",
        cargoId: Number.isFinite(roleId) ? roleId : 0,
        ativo: data.status !== "inactive",
      },
    );

    return mapEmployee(employee);
  },

  async update(
    id: string,
    data: UpdateEmployeeData,
  ): Promise<Employee> {
    const roleId = data.roleId !== undefined ? Number(data.roleId) : undefined;

    const employee = await apiClient.put<EmployeeApiResponse>(
      `/funcionarios/${id}`,
      {
        ...(data.name !== undefined ? { nome: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
        ...(data.password !== undefined ? { senha: data.password } : {}),
        ...(data.phone !== undefined ? { telefone: data.phone.trim() } : {}),
        ...(roleId !== undefined ? { cargoId: Number.isFinite(roleId) ? roleId : 0 } : {}),
        ...(data.status !== undefined ? { ativo: data.status !== "inactive" } : {}),
      },
    );

    return mapEmployee(employee);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(
      `/funcionarios/${id}`,
    );
  },

  async emailExists(
    _email: string,
    _ignoreId?: string,
  ): Promise<boolean> {
    return false;
  },
};