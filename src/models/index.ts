export interface ProductOptionItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface CartOptionItem
  extends ProductOptionItem {
  quantity: number;
}

export interface AddonCatalogItem
  extends ProductOptionItem {
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  items: ProductOptionItem[];
}

export interface AddonGroup
  extends ProductOption {
  applicableProductIds: string[];
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  available: boolean;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  order: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
  selectedOptions: CartOptionItem[];
  unitPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
}

export interface Address {
  id: string;

  label:
    | 'Casa'
    | 'Apartamento'
    | 'Trabalho';

  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  reference?: string;
  isDefault: boolean;
}

export type DeliveryType =
  | 'delivery'
  | 'pickup';

export type PaymentMethod =
  | 'pix'
  | 'cash'
  | 'credit'
  | 'debit';

export interface Payment {
  method: PaymentMethod;
  needsChange?: boolean;
  changeFor?: number;
}

export type OrderStatus =
  | 'pending'
  | 'sent'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;

  deliveryType?: DeliveryType;

  customer: Customer;
  address: Address;
  items: CartItem[];

  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;

  payment: Payment;
  status: OrderStatus;

  createdAt: string;
  updatedAt?: string;

  assignedCourierId?: string;
  assignedCourierName?: string;

  deliveredAt?: string;

  cancelledAt?: string;
  cancellationReason?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  promotionalPrices: Record<string, number>;
  active: boolean;
  clickable: boolean;
  badge: string;
  startsAt?: string;
  endsAt?: string;
  order: number;
}

export interface StoreConfig {
  storeName: string;
  description: string;
  whatsappNumber: string;
  pixKey: string;
  pixHolderName: string;
  deliveryFee: number;
  minimumOrder: number | null;
  menuSlug: string;
  estimatedTime: string;
  openingHours: string;
  isOpen: boolean;
  primaryColor: string;
  coverUrl: string;
}

export type Permission =
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_addons'
  | 'manage_promotions'
  | 'view_orders'
  | 'manage_orders'
  | 'cancel_orders'
  | 'manage_deliveries'
  | 'manage_settings'
  | 'manage_roles'
  | 'manage_employees'
  | 'manage_couriers';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  roleId: string;
}

export type EmployeeStatus =
  | 'active'
  | 'inactive';

export interface Employee {
  id: string;
  storeId: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicleModel: string;
  plate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}