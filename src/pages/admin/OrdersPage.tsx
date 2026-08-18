import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';

import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';
import { orderStatusClass, orderStatusLabel } from '../../utils/orderStatus';
import type { OrderStatus } from '../../models';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: orderStatusLabel.pending },
  { value: 'confirmed', label: orderStatusLabel.confirmed },
  { value: 'preparing', label: orderStatusLabel.preparing },
  { value: 'ready', label: orderStatusLabel.ready },
  { value: 'out_for_delivery', label: orderStatusLabel.out_for_delivery },
  { value: 'delivered', label: orderStatusLabel.delivered },
  { value: 'cancelled', label: orderStatusLabel.cancelled },
];

export function OrdersPage() {
  const [, refresh] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');

  const orders = orderService.getAll();

  useEffect(() => {
    return orderService.subscribe(() => refresh((value) => value + 1));
  }, []);

  function cancel(id: string) {
    const reason = prompt('Motivo do cancelamento:');

    if (reason) {
      orderService.cancel(id, reason);
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => status === 'all' || order.status === status)
      .filter((order) => {
        if (!term) return true;

        const inCustomer =
          order.customer.name.toLowerCase().includes(term) ||
          order.customer.phone.toLowerCase().includes(term);

        const inItems = order.items.some((item) =>
          item.product.name.toLowerCase().includes(term),
        );

        return inCustomer || inItems;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, search, status]);

  const hasActiveFilters = search.trim() !== '' || status !== 'all';

  function clearFilters() {
    setSearch('');
    setStatus('all');
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Histórico de pedidos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {filteredOrders.length}{' '}
            {filteredOrders.length === 1
              ? 'pedido encontrado'
              : 'pedidos encontrados'}
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, telefone ou item..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((option) => {
            const isActive = option.value === status;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'white',
                  borderColor: isActive ? 'var(--primary)' : '#e2e8f0',
                  color: isActive ? 'white' : '#475569',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 self-start text-xs font-semibold text-slate-500 hover:text-slate-700 sm:self-auto"
          >
            <X size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* TABELA */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="p-4 font-semibold">Horário</th>
              <th className="font-semibold">Cliente</th>
              <th className="font-semibold">Pedido</th>
              <th className="font-semibold">Valor</th>
              <th className="font-semibold">Situação</th>
              <th className="font-semibold">Entregador</th>
              <th className="font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap p-4 text-slate-600">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </td>
                <td>
                  <b className="text-slate-800">{order.customer.name}</b>
                  <br />
                  <small className="text-slate-500">
                    {order.customer.phone}
                  </small>
                </td>
                <td className="max-w-[260px] text-slate-600">
                  {order.items
                    .map((item) => `${item.quantity}x ${item.product.name}`)
                    .join(', ')}
                </td>
                <td className="font-semibold text-slate-800">
                  {formatCurrency(order.total)}
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusClass[order.status]}`}
                  >
                    {orderStatusLabel[order.status]}
                  </span>
                  {order.cancellationReason && (
                    <div className="mt-1 text-xs text-slate-500">
                      {order.cancellationReason}
                    </div>
                  )}
                </td>
                <td className="text-slate-600">
                  {order.assignedCourierName || '—'}
                </td>
                <td>
                  {!['cancelled', 'delivered'].includes(order.status) && (
                    <button
                      onClick={() => cancel(order.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!filteredOrders.length && (
              <tr>
                <td colSpan={7} className="p-16 text-center text-slate-400">
                  <ShoppingBag
                    size={28}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  {orders.length === 0
                    ? 'Nenhum pedido registrado ainda.'
                    : 'Nenhum pedido encontrado para este filtro.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}