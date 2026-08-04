import type { Order, OrderStatus } from '../models';
import { apiClient } from '../api/apiClient';
import { backendOnlyError } from './backendOnlyError';

interface ApiOrder {
  id: number;
  codigo: string;
  total: number | string;
  status: string;
  createdAt: string;
}

const orders: Order[] = [];

export const orderService = {
  getAll: (): Order[] => [...orders],

  async create(order: Order): Promise<ApiOrder> {
    return apiClient.post<ApiOrder>(
      '/pedidos',
      {
        clienteTelefone: order.customer.phone.replace(/\D/g, ''),
        itens: order.items.map((item) => ({
          pratoId: Number(item.product.id),
          quantidade: item.quantity,
          precoUnitario: item.unitPrice,
        })),
      },
      false,
    );
  },

  save: (_orders: Order[]): void => {
    backendOnlyError('os pedidos');
  },
  patch: (_id: string, _data: Partial<Order>): void => {
    backendOnlyError('o pedido', 'atualizar');
  },
  setStatus: (_id: string, _status: OrderStatus): void => {
    backendOnlyError('o status do pedido', 'atualizar');
  },
  cancel: (_id: string, _reason: string): void => {
    backendOnlyError('o pedido', 'cancelar');
  },
  assignCourier: (
    _id: string,
    _courierId: string,
    _courierName: string,
  ): void => {
    backendOnlyError('o entregador do pedido', 'atualizar');
  },
  markDelivered: (_id: string): void => {
    backendOnlyError('o pedido como entregue', 'marcar');
  },
};
