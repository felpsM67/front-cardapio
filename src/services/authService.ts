import type { Customer } from '../models';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from './storageService';
import { apiClient } from '../api/apiClient';

interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
}

interface JwtPayload {
  id?: number;
  sub?: string;
  email?: string;
  role?: string;
}

function decodeToken(token: string): JwtPayload {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return {};
  }
}

export const authService = {
  saveCustomer: (name: string, phone: string) => {
    const customer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      verified: true,
    };
    storageService.set(STORAGE_KEYS.CUSTOMER, customer);
    return customer;
  },

  verifyCode: (code: string) => /^\d{6}$/.test(code),

  async adminLogin(email: string, password: string): Promise<boolean> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/login',
        { email: email.trim().toLowerCase(), senha: password },
        false,
      );

      const payload = decodeToken(response.token);
      storageService.set(STORAGE_KEYS.ADMIN_SESSION, {
        id: String(payload.id ?? payload.sub ?? ''),
        name: payload.email ?? email,
        username: payload.email ?? email,
        roleId: payload.role ?? 'Funcionario',
        token: response.token,
        refreshToken: response.refreshToken,
      });

      return true;
    } catch {
      return false;
    }
  },

  adminLogout: () => storageService.remove(STORAGE_KEYS.ADMIN_SESSION),
};
