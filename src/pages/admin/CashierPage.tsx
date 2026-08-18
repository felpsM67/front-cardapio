import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  ChefHat,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  Store,
  Truck,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';

import type {
  Order,
  OrderStatus,
} from '../../models';

import { orderService } from '../../services/orderService';

import { formatCurrency } from '../../utils/format';

import {
  orderStatusClass,
  orderStatusLabel,
} from '../../utils/orderStatus';

import { Receipt } from '../../components/common/Receipt';

import '../../styles/receipt-print.css';

interface OrderColumnProps {
  title: string;
  description: string;
  orders: Order[];
  emptyMessage: string;
  children: (
    order: Order,
  ) => React.ReactNode;
}

function elapsedTime(
  createdAt: string,
): string {
  const created =
    new Date(
      createdAt,
    ).getTime();

  const now =
    Date.now();

  const minutes =
    Math.max(
      0,
      Math.floor(
        (now - created) /
          60000,
      ),
    );

  if (minutes < 1) {
    return 'Agora';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remainingMinutes =
    minutes % 60;

  if (
    remainingMinutes ===
    0
  ) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

function getTimeClass(
  createdAt: string,
): string {
  const created =
    new Date(
      createdAt,
    ).getTime();

  const minutes =
    Math.floor(
      (Date.now() -
        created) /
        60000,
    );

  if (minutes >= 30) {
    return 'bg-red-50 text-red-700';
  }

  if (minutes >= 15) {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function OrderColumn({
  title,
  description,
  orders,
  emptyMessage,
  children,
}: OrderColumnProps): React.JSX.Element {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900">
              {title}
            </h2>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-600">
              {orders.length}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map(
          (order) =>
            children(order),
        )}

        {!orders.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <CheckCircle2
              size={25}
              className="mx-auto text-slate-300"
            />

            <p className="mt-2 text-sm text-slate-400">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function CashierPage(): React.JSX.Element {
  const [
    refreshKey,
    refresh,
  ] =
    useState(0);

  const [
    orderToPrint,
    setOrderToPrint,
  ] =
    useState<Order | null>(
      null,
    );

  /*
   * Atualiza quando o orderService
   * notificar alguma alteração.
   */
  useEffect(() => {
    return orderService.subscribe(
      () =>
        refresh(
          (value) =>
            value + 1,
        ),
    );
  }, []);

  /*
   * Atualiza o tempo dos pedidos
   * a cada minuto.
   */
  useEffect(() => {
    const timer =
      window.setInterval(
        () =>
          refresh(
            (value) =>
              value + 1,
          ),
        60000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  /*
   * Impressão.
   */
  useEffect(() => {
    if (!orderToPrint) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          window.print();

          setOrderToPrint(
            null,
          );
        },
        80,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [orderToPrint]);

  const orders =
    useMemo(
      () =>
        orderService
          .getAll()
          .filter(
            (order) =>
              order.status !==
                'cancelled' &&
              order.status !==
                'delivered',
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt,
              ).getTime() -
              new Date(
                b.createdAt,
              ).getTime(),
          ),
      [refreshKey],
    );

  /*
   * FILAS
   */

  const newOrders =
    orders.filter(
      (order) =>
        order.status ===
          'pending' ||
        order.status ===
          'sent' ||
        order.status ===
          'confirmed',
    );

  const preparingOrders =
    orders.filter(
      (order) =>
        order.status ===
        'preparing',
    );

  const readyOrders =
    orders.filter(
      (order) =>
        order.status ===
          'ready' ||
        order.status ===
          'out_for_delivery',
    );

  const pickupCount =
    orders.filter(
      (order) =>
        order.deliveryType ===
        'pickup',
    ).length;

  const deliveryCount =
    orders.filter(
      (order) =>
        order.deliveryType !==
        'pickup',
    ).length;

  function update(
    id: string,
    status: OrderStatus,
  ): void {
    orderService.setStatus(
      id,
      status,
    );
  }

  function cancel(
    id: string,
  ): void {
    const reason =
      window.prompt(
        'Motivo do cancelamento:',
      );

    if (
      !reason?.trim()
    ) {
      return;
    }

    orderService.cancel(
      id,
      reason.trim(),
    );
  }

  /*
   * Define somente a próxima
   * ação que o atendente precisa
   * executar.
   */
  function getNextAction(
    order: Order,
  ): {
    status: OrderStatus;
    label: string;
    icon: typeof ChefHat;
  } | null {
    const pickup =
      order.deliveryType ===
      'pickup';

    if (
      order.status ===
        'pending' ||
      order.status ===
        'sent'
    ) {
      return {
        status:
          'confirmed',
        label:
          'Confirmar pedido',
        icon:
          CheckCircle2,
      };
    }

    if (
      order.status ===
      'confirmed'
    ) {
      return {
        status:
          'preparing',
        label:
          'Iniciar preparo',
        icon:
          ChefHat,
      };
    }

    if (
      order.status ===
      'preparing'
    ) {
      return {
        status:
          'ready',

        label: pickup
          ? 'Pronto para retirada'
          : 'Pedido pronto',

        icon:
          PackageCheck,
      };
    }

    if (
      order.status ===
      'ready'
    ) {
      if (pickup) {
        return {
          status:
            'delivered',

          label:
            'Pedido retirado',

          icon:
            CheckCircle2,
        };
      }

      return {
        status:
          'out_for_delivery',

        label:
          'Saiu para entrega',

        icon:
          Truck,
      };
    }

    if (
      order.status ===
      'out_for_delivery'
    ) {
      return {
        status:
          'delivered',

        label:
          'Marcar como entregue',

        icon:
          CheckCircle2,
      };
    }

    return null;
  }

  function renderOrder(
    order: Order,
  ): React.JSX.Element {
    const nextAction =
      getNextAction(order);

    const NextIcon =
      nextAction?.icon;

    const pickup =
      order.deliveryType ===
      'pickup';

    const address =
      order.address;

    return (
      <article
        key={order.id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        {/* TOPO */}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base text-slate-900">
                  #{order.id}
                </strong>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    pickup
                      ? 'bg-violet-50 text-violet-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {pickup
                    ? 'RETIRADA'
                    : 'ENTREGA'}
                </span>
              </div>

              <h3 className="mt-2 truncate text-lg font-bold text-slate-900">
                {
                  order.customer
                    .name
                }
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock3
                    size={13}
                  />

                  {new Date(
                    order.createdAt,
                  ).toLocaleTimeString(
                    'pt-BR',
                    {
                      hour:
                        '2-digit',
                      minute:
                        '2-digit',
                    },
                  )}
                </span>

                <span>
                  •
                </span>

                <span className="flex items-center gap-1">
                  <Phone
                    size={13}
                  />

                  {
                    order.customer
                      .phone
                  }
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  orderStatusClass[
                    order.status
                  ]
                }`}
              >
                {
                  orderStatusLabel[
                    order.status
                  ]
                }
              </span>

              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getTimeClass(
                  order.createdAt,
                )}`}
              >
                {elapsedTime(
                  order.createdAt,
                )}
              </span>
            </div>
          </div>

          {/* ENDEREÇO / RETIRADA */}

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            {pickup ? (
              <>
                <Store
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Cliente retira
                  na loja
                </span>
              </>
            ) : (
              <>
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span className="line-clamp-2">
                  {address?.street
                    ? `${address.street}, ${address.number ?? ''} - ${address.district ?? ''}`
                    : 'Endereço de entrega'}
                </span>
              </>
            )}
          </div>

          {/* ITENS */}

          <div className="mt-4">
            <div className="space-y-3">
              {order.items.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                  >
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 font-medium text-slate-800">
                        <strong
                          style={{
                            color:
                              'var(--primary)',
                          }}
                        >
                          {
                            item.quantity
                          }
                          x
                        </strong>{' '}
                        {
                          item.product
                            .name
                        }
                      </span>

                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {formatCurrency(
                          item.quantity *
                            item.unitPrice,
                        )}
                      </span>
                    </div>

                    {item
                      .selectedOptions
                      ?.length >
                      0 && (
                      <p className="mt-1 pl-5 text-xs leading-5 text-slate-500">
                        {item.selectedOptions
                          .map(
                            (
                              option,
                            ) =>
                              `${
                                option.quantity
                              }x ${
                                option.name
                              }`,
                          )
                          .join(
                            ', ',
                          )}
                      </p>
                    )}

                    {item.notes && (
                      <div className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800">
                        Obs:{' '}
                        {
                          item.notes
                        }
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* TOTAL */}

        <div className="flex items-center justify-between border-y border-slate-100 bg-slate-50/60 px-4 py-3">
          <span className="text-sm text-slate-500">
            Total
          </span>

          <strong className="text-lg text-slate-900">
            {formatCurrency(
              order.total,
            )}
          </strong>
        </div>

        {/* AÇÕES */}

        <div className="p-3">
          {nextAction &&
            NextIcon && (
              <button
                type="button"
                onClick={() =>
                  update(
                    order.id,
                    nextAction.status,
                  )
                }
                style={{
                  backgroundColor:
                    'var(--primary)',
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
              >
                <NextIcon
                  size={17}
                />

                {
                  nextAction.label
                }
              </button>
            )}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setOrderToPrint(
                  order,
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Printer
                size={15}
              />

              Imprimir
            </button>

            <button
              type="button"
              onClick={() =>
                cancel(
                  order.id,
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <XCircle
                size={15}
              />

              Cancelar
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div>
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed
              size={24}
              style={{
                color:
                  'var(--primary)',
              }}
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Pedidos
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os pedidos
            em andamento.
          </p>
        </div>

        {/* RESUMO */}

        <div className="flex gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs text-slate-400">
              Entrega
            </span>

            <strong className="ml-2 text-sm text-slate-900">
              {
                deliveryCount
              }
            </strong>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs text-slate-400">
              Retirada
            </span>

            <strong className="ml-2 text-sm text-slate-900">
              {
                pickupCount
              }
            </strong>
          </div>
        </div>
      </div>

      {/* FILAS */}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <OrderColumn
          title="Novos"
          description="Pedidos aguardando atendimento"
          orders={
            newOrders
          }
          emptyMessage="Nenhum pedido novo."
        >
          {renderOrder}
        </OrderColumn>

        <OrderColumn
          title="Em preparo"
          description="Pedidos sendo preparados"
          orders={
            preparingOrders
          }
          emptyMessage="Nenhum pedido em preparo."
        >
          {renderOrder}
        </OrderColumn>

        <OrderColumn
          title="Prontos / saída"
          description="Aguardando retirada ou entrega"
          orders={
            readyOrders
          }
          emptyMessage="Nenhum pedido aguardando saída."
        >
          {renderOrder}
        </OrderColumn>
      </div>

      {/* IMPRESSÃO */}

      {orderToPrint && (
        <Receipt
          order={
            orderToPrint
          }
        />
      )}
    </div>
  );
}