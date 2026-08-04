import type { Permission, Role } from '../models';

export interface PredefinedRole {
  name: string;
  description: string;
  permissions: Permission[];
}

export const ALL_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'manage_products',
  'manage_categories',
  'manage_addons',
  'manage_promotions',
  'view_orders',
  'manage_orders',
  'cancel_orders',
  'manage_deliveries',
  'manage_settings',
  'manage_roles',
  'manage_employees',
  'manage_couriers',
];

export const PREDEFINED_ROLES: PredefinedRole[] = [
  {
    name: 'Gerente',
    description: 'Acesso completo a todas as áreas e configurações do sistema.',
    permissions: [...ALL_PERMISSIONS],
  },
  {
    name: 'Caixa',
    description: 'Acesso somente à consulta, atualização e cancelamento de pedidos.',
    permissions: ['view_orders', 'manage_orders', 'cancel_orders'],
  },
  {
    name: 'Entregador',
    description: 'Acesso somente à área de entregas.',
    permissions: ['manage_deliveries'],
  },
];

export function normalizeRoleName(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function isPredefinedRole(role: Pick<Role, 'name'>): boolean {
  const normalizedName = normalizeRoleName(role.name);

  return PREDEFINED_ROLES.some(
    (predefinedRole) =>
      normalizeRoleName(predefinedRole.name) === normalizedName,
  );
}

export function sortPredefinedRoles(roles: Role[]): Role[] {
  return [...roles].sort((firstRole, secondRole) => {
    const firstIndex = PREDEFINED_ROLES.findIndex(
      (role) =>
        normalizeRoleName(role.name) === normalizeRoleName(firstRole.name),
    );
    const secondIndex = PREDEFINED_ROLES.findIndex(
      (role) =>
        normalizeRoleName(role.name) === normalizeRoleName(secondRole.name),
    );

    return firstIndex - secondIndex;
  });
}
