import type { Courier } from '../models';
import { backendOnlyError } from './backendOnlyError';

export const courierService = {
  getAll: (): Courier[] => [],
  save: (_items: Courier[]): void => {
    backendOnlyError('os entregadores');
  },
  create: (_data: Omit<Courier, 'id' | 'createdAt' | 'updatedAt'>): void => {
    backendOnlyError('o entregador');
  },
  update: (_id: string, _data: Partial<Courier>): void => {
    backendOnlyError('o entregador', 'atualizar');
  },
  remove: (_id: string): void => {
    backendOnlyError('o entregador', 'excluir');
  },
};
