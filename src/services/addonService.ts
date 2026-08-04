import type { AddonGroup } from '../models';
import { backendOnlyError } from './backendOnlyError';

export const addonService = {
  getAll: (): AddonGroup[] => [],

  save: (_items: AddonGroup[]): void => {
    backendOnlyError('os grupos de adicionais');
  },

  getForProduct: (_id: string): AddonGroup[] => [],

  create: (_data: Omit<AddonGroup, 'id'>): AddonGroup =>
    backendOnlyError('o grupo de adicionais'),

  update: (_id: string, _data: Partial<AddonGroup>): void => {
    backendOnlyError('o grupo de adicionais', 'atualizar');
  },

  remove: (_id: string): void => {
    backendOnlyError('o grupo de adicionais', 'excluir');
  },
};
