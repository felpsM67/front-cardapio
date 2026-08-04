import type { Employee } from '../models';
import { backendOnlyError } from './backendOnlyError';

export const employeeService = {
  getAll: (): Employee[] => [],
  getAllForStore: (_storeId: string): Employee[] => [],
  save: (_items: Employee[]): void => {
    backendOnlyError('os funcionários');
  },
  create: (
    _data: Omit<Employee, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>,
  ): void => {
    backendOnlyError('o funcionário');
  },
  update: (_id: string, _data: Partial<Employee>): void => {
    backendOnlyError('o funcionário', 'atualizar');
  },
  remove: (_id: string): void => {
    backendOnlyError('o funcionário', 'excluir');
  },
  usernameExists: (_username: string, _ignoreId?: string): boolean => false,
};
