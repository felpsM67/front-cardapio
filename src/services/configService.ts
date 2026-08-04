import type { StoreConfig } from '../models';
import { defaultStoreConfig } from '../constants/storeConfig';
import { backendOnlyError } from './backendOnlyError';

export const configService = {
  get: (): StoreConfig => ({ ...defaultStoreConfig }),
  save: (_value: StoreConfig): void => {
    backendOnlyError('as configurações da loja');
  },
};
