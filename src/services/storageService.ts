import { storeService } from './storeService';

const TEMPORARY_KEYS = new Set([
  'digital-menu-cart',
  'digital-menu-customer',
  'digital-menu-admin-session',
  'digital-menu-checkout-payment',
  'digital-menu-checkout-address',
]);

function scopedKey(storeId: string, key: string): string {
  return `${storeId}:${key}`;
}

function ensureTemporaryKey(key: string): void {
  if (!TEMPORARY_KEYS.has(key)) {
    throw new Error(
      'Não foi possível salvar. Este dado precisa ser gravado no backend e não pode usar armazenamento local.',
    );
  }
}

export const storageService = {
  get<T>(key: string, fallback: T): T {
    return this.getForStore(storeService.getCurrent().id, key, fallback);
  },

  set<T>(key: string, value: T): void {
    this.setForStore(storeService.getCurrent().id, key, value);
  },

  remove(key: string): void {
    this.removeForStore(storeService.getCurrent().id, key);
  },

  getForStore<T>(storeId: string, key: string, fallback: T): T {
    ensureTemporaryKey(key);

    try {
      const raw = sessionStorage.getItem(scopedKey(storeId, key));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setForStore<T>(storeId: string, key: string, value: T): void {
    ensureTemporaryKey(key);
    sessionStorage.setItem(scopedKey(storeId, key), JSON.stringify(value));
  },

  removeForStore(storeId: string, key: string): void {
    ensureTemporaryKey(key);
    sessionStorage.removeItem(scopedKey(storeId, key));
  },
};
