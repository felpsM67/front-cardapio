import type { Address } from '../models';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from './storageService';

function customerKey(phone: string): string {
  return phone.replace(/\D/g, '');
}

export const addressService = {
  getLast(phone: string): Address | null {
    const addresses = storageService.get<Record<string, Address>>(
      STORAGE_KEYS.ADDRESSES,
      {},
    );

    return addresses[customerKey(phone)] ?? null;
  },

  saveLast(phone: string, address: Address): void {
    const addresses = storageService.get<Record<string, Address>>(
      STORAGE_KEYS.ADDRESSES,
      {},
    );

    storageService.set(STORAGE_KEYS.ADDRESSES, {
      ...addresses,
      [customerKey(phone)]: address,
    });
  },
};
