  import { STORAGE_KEYS } from '../constants/storage';
  import { storageService } from '../services/storageService';

  const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

  interface AdminSession {
    token?: string;
  }

  export class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly details?: unknown,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  }

  function getToken(): string | undefined {
    return storageService.get<AdminSession | null>(STORAGE_KEYS.ADMIN_SESSION, null)?.token;
  }

  function getErrorMessage(body: unknown, fallback: string): string {
    if (!body || typeof body !== 'object') return fallback;

    const payload = body as Record<string, unknown>;
    const value = payload.message ?? payload.error;

    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'message' in value) {
      const nested = (value as { message?: unknown }).message;
      if (typeof nested === 'string') return nested;
    }

    return fallback;
  }

  async function request<T>(
    path: string,
    options: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (authenticated) {
      const token = getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new ApiError(
        'Não foi possível conectar ao backend. Confirme se a API está rodando na porta 3000.',
        0,
        error,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    const body = response.status === 204
      ? null
      : contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(body, `Erro ${response.status} ao acessar a API.`),
        response.status,
        body,
      );
    }

    return body as T;
  }

  export const apiClient = {
    get: <T>(path: string, authenticated = false) =>
      request<T>(path, { method: 'GET' }, authenticated),

    post: <T>(path: string, body: unknown, authenticated = true) =>
      request<T>(
        path,
        { method: 'POST', body: JSON.stringify(body) },
        authenticated,
      ),

    put: <T>(path: string, body: unknown, authenticated = true) =>
      request<T>(
        path,
        { method: 'PUT', body: JSON.stringify(body) },
        authenticated,
      ),

    patch: <T>(path: string, body: unknown, authenticated = true) =>
      request<T>(
        path,
        { method: 'PATCH', body: JSON.stringify(body) },
        authenticated,
      ),

    delete: <T>(path: string, authenticated = true) =>
      request<T>(path, { method: 'DELETE' }, authenticated),
  };
