import type {Role,StoreConfig} from '../models';
export const defaultStoreConfig:StoreConfig={storeName:'Sabor Express',description:'Hambúrgueres artesanais, pizzas e porções',whatsappNumber:'5567999999999',pixKey:'chave-pix@exemplo.com',pixHolderName:'Sabor Express LTDA',deliveryFee:5,minimumOrder:20,estimatedTime:'35–50 min',openingHours:'18:00 às 23:30',isOpen:true,primaryColor:'#ea580c',coverUrl:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80'};
export const ADMIN_CREDENTIALS={email:'admin@cardapio.com',password:'admin123'};
export const defaultRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema.',
    permissions: [
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
    ],
  },
  {
    id: 'role-manager',
    name: 'Gerente',
    description: 'Gerencia pedidos, equipe e operação.',
    permissions: [
      'view_dashboard',
      'manage_products',
      'manage_categories',
      'manage_addons',
      'manage_promotions',
      'view_orders',
      'manage_orders',
      'cancel_orders',
      'manage_deliveries',
      'manage_employees',
      'manage_couriers',
    ],
  },
  {
    id: 'role-cashier',
    name: 'Caixa',
    description: 'Visualiza e atualiza pedidos, sem cancelar.',
    permissions: ['view_dashboard', 'view_orders', 'manage_orders'],
  },
  {
    id: 'role-kitchen',
    name: 'Cozinha',
    description: 'Acompanha e atualiza o preparo dos pedidos.',
    permissions: ['view_orders', 'manage_orders'],
  },
];
