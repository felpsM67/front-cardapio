import type { Address, CartItem, Customer, Order, OrderStatus, Payment, Product } from '../models';
import { apiClient } from '../api/apiClient';
import { productService } from './productService';

interface ApiOrderItem {
  id?: number;
  pratoId?: number;
  quantidade?: number;
  precoUnitario?: number | string;
  observacao?: string;
  adicionais?: unknown[];
  prato?: {
    id?: number;
    nome?: string;
  };
}

interface ApiOrder {
  id: number;
  codigo?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  endereco?: Record<string, unknown>;
  pagamento?: Record<string, unknown>;
  subtotal?: number | string;
  valorFrete?: number | string;
  desconto?: number | string;
  total?: number | string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  entregadorId?: number | null;
  entregadorNome?: string | null;
  motivoCancelamento?: string | null;
  entregueEm?: string | null;
  canceladoEm?: string | null;
  itens?: ApiOrderItem[];
}

const orders: Order[] = [];
const listeners = new Set<() => void>();
let hasLoadedFromApi = false;
let loadingPromise: Promise<void> | null = null;

function normalizeStatus(status?: string): OrderStatus {
  switch (status) {
    case 'pending':
    case 'PENDENTE':
      return 'pending';
    case 'sent':
    case 'ENVIADO':
      return 'sent';
    case 'confirmed':
    case 'CONFIRMADO':
      return 'confirmed';
    case 'preparing':
    case 'PREPARANDO':
      return 'preparing';
    case 'ready':
    case 'PRONTO':
      return 'ready';
    case 'out_for_delivery':
    case 'SAIU_ENTREGA':
    case 'saiu_entrega':
      return 'out_for_delivery';
    case 'delivered':
    case 'ENTREGUE':
      return 'delivered';
    case 'cancelled':
    case 'CANCELADO':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function resolveProduct(item: ApiOrderItem, fallbackOrder: Order): Product {
  const productId = item.pratoId ? String(item.pratoId) : item.prato?.id ? String(item.prato.id) : '';
  const existingProduct = productId ? productService.getById(productId) : undefined;

  if (existingProduct) {
    return existingProduct;
  }

  const now = new Date().toISOString();

  return {
    id: productId || fallbackOrder.id,
    name: item.prato?.nome || 'Item sem catálogo',
    description: '',
    price: Number(item.precoUnitario ?? 0),
    imageUrl: '',
    categoryId: '',
    available: true,
    featured: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function mapApiOrder(apiOrder: ApiOrder, fallbackOrder: Order): Order {
  const items = (apiOrder.itens ?? []).map((item, index) => {
    const product = resolveProduct(item, fallbackOrder);

    const selectedOptions = Array.isArray(item.adicionais)
      ? item.adicionais.filter((option): option is Record<string, unknown> => Boolean(option && typeof option === 'object'))
          .map((option) => ({
            id: String(option.id ?? `${apiOrder.id}-${index + 1}`),
            name: String(option.name ?? 'Adicional'),
            price: Number(option.price ?? 0),
            available: Boolean(option.available ?? true),
            quantity: Number(option.quantity ?? 1),
          }))
      : [];

    return {
      id: `${apiOrder.id}-${index + 1}`,
      product,
      quantity: Number(item.quantidade ?? 1),
      notes: item.observacao ?? '',
      selectedOptions,
      unitPrice: Number(item.precoUnitario ?? product.price ?? 0),
    } satisfies CartItem;
  });

  const customer: Customer = {
    id: `customer-${apiOrder.id}`,
    name: apiOrder.clienteNome?.trim() || fallbackOrder.customer.name || 'Cliente',
    phone: apiOrder.clienteTelefone || fallbackOrder.customer.phone || '',
    verified: true,
  };

  const address: Address = {
    id: fallbackOrder.address.id || 'checkout-address',
    label: (apiOrder.endereco?.label as Address['label']) ?? fallbackOrder.address.label,
    cep: String(apiOrder.endereco?.cep ?? fallbackOrder.address.cep ?? ''),
    street: String(apiOrder.endereco?.street ?? fallbackOrder.address.street ?? ''),
    number: String(apiOrder.endereco?.number ?? fallbackOrder.address.number ?? ''),
    complement: String(apiOrder.endereco?.complement ?? fallbackOrder.address.complement ?? ''),
    district: String(apiOrder.endereco?.district ?? fallbackOrder.address.district ?? ''),
    city: String(apiOrder.endereco?.city ?? fallbackOrder.address.city ?? ''),
    state: String(apiOrder.endereco?.state ?? fallbackOrder.address.state ?? ''),
    reference: String(apiOrder.endereco?.reference ?? fallbackOrder.address.reference ?? ''),
    isDefault: Boolean(apiOrder.endereco?.isDefault ?? fallbackOrder.address.isDefault),
  };

  const payment: Payment = {
    method: (apiOrder.pagamento?.method as Payment['method']) ?? fallbackOrder.payment.method,
    needsChange: Boolean(apiOrder.pagamento?.needsChange ?? fallbackOrder.payment.needsChange),
    changeFor: apiOrder.pagamento?.changeFor
      ? Number(apiOrder.pagamento.changeFor)
      : fallbackOrder.payment.changeFor,
  };

  return {
    id: String(apiOrder.id),
    customer,
    address,
    items,
    subtotal: Number(apiOrder.subtotal ?? fallbackOrder.subtotal ?? 0),
    deliveryFee: Number(apiOrder.valorFrete ?? fallbackOrder.deliveryFee ?? 0),
    discount: Number(apiOrder.desconto ?? fallbackOrder.discount ?? 0),
    total: Number(apiOrder.total ?? fallbackOrder.total ?? 0),
    payment,
    status: normalizeStatus(apiOrder.status) ?? fallbackOrder.status,
    createdAt: apiOrder.createdAt ?? fallbackOrder.createdAt,
    updatedAt: apiOrder.updatedAt ?? fallbackOrder.updatedAt,
    assignedCourierId: apiOrder.entregadorId ? String(apiOrder.entregadorId) : fallbackOrder.assignedCourierId,
    assignedCourierName: apiOrder.entregadorNome ?? fallbackOrder.assignedCourierName,
    cancellationReason: apiOrder.motivoCancelamento ?? fallbackOrder.cancellationReason,
  };
}

function buildCreatePayload(order: Order) {
  return {
    clienteNome: order.customer.name.trim(),
    clienteTelefone: order.customer.phone.replace(/\D/g, ''),
    endereco: {
      label: order.address.label,
      cep: order.address.cep,
      street: order.address.street,
      number: order.address.number,
      complement: order.address.complement ?? '',
      district: order.address.district,
      city: order.address.city,
      state: order.address.state,
      reference: order.address.reference ?? '',
      isDefault: order.address.isDefault,
    },
    pagamento: {
      method: order.payment.method,
      needsChange: order.payment.needsChange ?? false,
      changeFor: order.payment.changeFor ?? null,
    },
    valorFrete: Number(order.deliveryFee ?? 0),
    desconto: Number(order.discount ?? 0),
    itens: order.items.map((item) => ({
      pratoId: Number(item.product.id),
      quantidade: item.quantity,
      precoUnitario: Number(item.unitPrice ?? item.product.price),
      observacao: item.notes ?? '',
      adicionais: item.selectedOptions ?? [],
    })),
  };
}

async function loadFromApi(): Promise<void> {
  if (hasLoadedFromApi || loadingPromise) {
    return loadingPromise ?? Promise.resolve();
  }

  loadingPromise = (async () => {
    try {
      const response = await apiClient.get<ApiOrder[]>('/pedidos', true);
      const mappedOrders = response.map((item) => mapApiOrder(item, { ...orders[0], id: String(item.id), customer: { id: '', name: '', phone: '', verified: true }, address: { id: 'checkout-address', label: 'Casa', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', reference: '', isDefault: true }, items: [], subtotal: 0, deliveryFee: 0, discount: 0, total: 0, payment: { method: 'pix' }, status: 'pending', createdAt: new Date().toISOString() }));
      orders.splice(0, orders.length, ...mappedOrders);
      hasLoadedFromApi = true;
      notifyListeners();
    } catch (error) {
      console.error('Não foi possível carregar os pedidos do backend.', error);
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

function replaceOrder(id: string, nextOrder: Order): void {
  const index = orders.findIndex((order) => order.id === id);

  if (index >= 0) {
    orders[index] = nextOrder;
    notifyListeners();
  }
}

export const orderService = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getAll: (): Order[] => {
    void loadFromApi();
    return [...orders];
  },

  async create(order: Order): Promise<Order> {
    const response = await apiClient.post<ApiOrder>('/pedidos', buildCreatePayload(order), false);
    const createdOrder = mapApiOrder(response, order);
    orders.unshift(createdOrder);
    notifyListeners();
    return createdOrder;
  },

  save: (nextOrders: Order[]): void => {
    orders.splice(0, orders.length, ...nextOrders);
    notifyListeners();
  },

  async patch(id: string, data: Partial<Order>): Promise<void> {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      return;
    }

    const response = await apiClient.put<ApiOrder>(`/pedidos/${encodeURIComponent(id)}`, data, true);
    replaceOrder(id, mapApiOrder(response, currentOrder));
  },

  async setStatus(
    id: string,
     status: OrderStatus
    ): Promise<void> {
    const currentOrder = orders.find(
      (order) => order.id === id
    );

    if (!currentOrder) {
      return;
      throw new Error('Pedido não encontrado.');
    }

    const response = await apiClient.put<ApiOrder>(`/pedidos/${encodeURIComponent(id)}`, { status }, true);
    replaceOrder(id, mapApiOrder(response, currentOrder));
  },

  async cancel(id: string, reason: string): Promise<void> {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      return;
    }

    const response = await apiClient.put<ApiOrder>(`/pedidos/${encodeURIComponent(id)}`, { status: 'cancelled', motivoCancelamento: reason }, true);
    replaceOrder(id, mapApiOrder(response, currentOrder));
  },

  async assignCourier(id: string, courierId: string, courierName: string): Promise<void> {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      return;
    }

    const response = await apiClient.put<ApiOrder>(`/pedidos/${encodeURIComponent(id)}`, { entregadorId: Number(courierId), entregadorNome: courierName }, true);
    replaceOrder(id, mapApiOrder(response, currentOrder));
  },

  async markDelivered(id: string): Promise<void> {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      return;
    }

    const response = await apiClient.put<ApiOrder>(`/pedidos/${encodeURIComponent(id)}`, { status: 'delivered' }, true);
    replaceOrder(id, mapApiOrder(response, currentOrder));
  },
};
