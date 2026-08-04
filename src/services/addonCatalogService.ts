import type { AddonCatalogItem } from '../models';
import { backendOnlyError } from './backendOnlyError';

export const addonCatalogService = {
  getAll(): AddonCatalogItem[] {
    return [];
  },

  save(_items: AddonCatalogItem[]): void {
    backendOnlyError('os adicionais');
  },

  create(
    _data: Pick<AddonCatalogItem, 'name' | 'price' | 'available'>,
  ): AddonCatalogItem {
    return backendOnlyError('o adicional');
  },

  update(
    _id: string,
    _data: Partial<Pick<AddonCatalogItem, 'name' | 'price' | 'available'>>,
  ): void {
    backendOnlyError('o adicional', 'atualizar');
  },

  remove(_id: string): void {
    backendOnlyError('o adicional', 'excluir');
  },
};
