import { useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import type { OrderStatus } from '../../models';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';
import {
  orderStatusClass,
  orderStatusLabel,
} from '../../utils/orderStatus';

const actions: {
  status: OrderStatus;
  label: string;
  icon: typeof ChefHat;
}[] = [
  {
    status: 'confirmed',
    label: 'Confirmar',
    icon: CheckCircle2,
  },
  {
    status: 'preparing',
    label: 'Em preparo',
    icon: ChefHat,
  },
  {
    status: 'out_for_delivery',
    label: 'Saiu para entrega',
    icon: Truck,
  },
];

export function CashierPage() {
  const [, refresh] = useState(0);
  const orders = orderService
    .getAll()
    .filter(
      (order) =>
        order.status !== 'cancelled' && order.status !== 'delivered',
    );

  function update(id: string, status: OrderStatus) {
    orderService.setStatus(id, status);
    refresh((value) => value + 1);
  }

  function cancel(id: string) {
    const reason = prompt('Motivo do cancelamento:');

    if (reason) {
      orderService.cancel(id, reason);
      refresh((value) => value + 1);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <UtensilsCrossed size={32} />
        <div>
          <h1 className="text-3xl font-black">Painel do caixa</h1>
          <p className="text-slate-500">
            Acompanhe e atualize o fluxo dos pedidos.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  PEDIDO #{order.id}
                </p>
                <h2 className="text-xl font-black">{order.customer.name}</h2>
                <p className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {order.customer.phone}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  orderStatusClass[order.status]
                }`}
              >
                {orderStatusLabel[order.status]}
              </span>
            </div>

            <div className="my-4 rounded-xl bg-slate-50 p-4 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>
                    <b>{item.quantity}x</b> {item.product.name}
                  </span>
                  <span>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}

              <div className="mt-2 flex justify-between border-t pt-2 font-black">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.status}
                    onClick={() => update(order.id, action.status)}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold transition hover:-translate-y-0.5 ${
                      order.status === action.status
                        ? 'border-transparent text-white'
                        : 'bg-white'
                    }`}
                    style={
                      order.status === action.status
                        ? { backgroundColor: 'var(--primary)' }
                        : {}
                    }
                  >
                    <Icon size={16} />
                    {action.label}
                  </button>
                );
              })}

              <button
                onClick={() => cancel(order.id)}
                className="ml-auto rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
              >
                Cancelar
              </button>
            </div>
          </article>
        ))}

        {!orders.length && (
          <div className="col-span-full rounded-2xl bg-white p-16 text-center text-slate-500">
            Nenhum pedido aguardando atendimento.
          </div>
        )}
      </div>
    </div>
  );
}
