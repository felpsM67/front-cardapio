import { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';
import { orderStatusClass, orderStatusLabel } from '../../utils/orderStatus';

export function OrdersPage() {
  const [, refresh] = useState(0);
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

  return (
    <div>
      <h1 className="text-3xl font-black">Histórico de pedidos</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-4">Horário</th>
              <th>Cliente</th>
              <th>Pedido</th>
              <th>Valor</th>
              <th>Situação</th>
              <th>Entregador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-4">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </td>
                <td>
                  <b>{order.customer.name}</b>
                  <br />
                  <small>{order.customer.phone}</small>
                </td>
                <td>
                  {order.items
                    .map((item) => `${item.quantity}x ${item.product.name}`)
                    .join(', ')}
                </td>
                <td>{formatCurrency(order.total)}</td>
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
                <td>{order.assignedCourierName || '—'}</td>
                <td>
                  {!['cancelled', 'delivered'].includes(order.status) && (
                    <button
                      onClick={() => cancel(order.id)}
                      className="text-red-600"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  Nenhum pedido registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

