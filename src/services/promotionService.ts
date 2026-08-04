import type { Promotion } from '../models';
import { backendOnlyError } from './backendOnlyError';

export const promotionService = {
  getAll: (): Promotion[] => [],
  save: (_items: Promotion[]): void => {
    backendOnlyError('as promoções');
  },
  create: (_data: Omit<Promotion, 'id'>): Promotion =>
    backendOnlyError('a promoção'),
  update: (_id: string, _data: Partial<Promotion>): void => {
    backendOnlyError('a promoção', 'atualizar');
  },
  remove: (_id: string): void => {
    backendOnlyError('a promoção', 'excluir');
  },
};
