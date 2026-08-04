export type AdminRole = 'manager' | 'cashier' | 'courier' | 'unknown';

export function resolveAdminRole(value?: string | null): AdminRole {
  const normalizedValue = String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (['gerente', 'admin', 'administrador', 'manager'].includes(normalizedValue)) {
    return 'manager';
  }

  if (['caixa', 'cashier', 'atendente'].includes(normalizedValue)) {
    return 'cashier';
  }

  if (['entregador', 'courier', 'delivery'].includes(normalizedValue)) {
    return 'courier';
  }

  return 'unknown';
}

export function getDefaultAdminPath(role: AdminRole): string {
  if (role === 'manager') return '/admin';
  if (role === 'cashier') return '/admin/caixa';
  if (role === 'courier') return '/admin/entregas';
  return '/admin/login';
}
