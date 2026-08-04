import type { Customer } from '../models';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from './storageService';
import { apiClient } from '../api/apiClient';
import { getDefaultAdminPath, resolveAdminRole } from '../constants/adminAccess';

interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  role?: string;
  cargo?: string;
  user?: {
    role?: string;
    cargo?: string;
    email?: string;
    name?: string;
  };
}

interface JwtPayload {
  id?: number;
  sub?: string;
  email?: string;
  role?: string;
  cargo?: string;
  funcao?: string;
}

function decodeToken(token: string): JwtPayload {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const utf8Payload = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(utf8Payload) as JwtPayload;
  } catch {
    return {};
  }
}

function extractRole(response: LoginResponse, payload: JwtPayload): string | undefined {
  const roleCandidates = [
    response.role,
    response.cargo,
    response.user?.role,
    response.user?.cargo,
    payload.role,
    payload.cargo,
    payload.funcao,
  ];

  return roleCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
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
        { email: String(email ?? '').trim().toLowerCase(), senha: password },
        false,
      );

      const payload = decodeToken(response.token);
      const roleId = extractRole(response, payload) ?? payload.role ?? 'Funcionario';

      storageService.set(STORAGE_KEYS.ADMIN_SESSION, {
        id: String(payload.id ?? payload.sub ?? ''),
        name: payload.email ?? response.user?.name ?? email,
        username: payload.email ?? response.user?.email ?? email,
        roleId,
        token: response.token,
        refreshToken: response.refreshToken,
      });

      return true;
    } catch {
      return false;
    }
  },

  getAdminStartPath(): string {
    const session = storageService.get<{ roleId?: string } | null>(
      STORAGE_KEYS.ADMIN_SESSION,
      null,
    );

    return getDefaultAdminPath(resolveAdminRole(session?.roleId));
  },

  adminLogout: () => storageService.remove(STORAGE_KEYS.ADMIN_SESSION),
};
