import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Filter,
  Package,
  ShoppingBag,
  Tags,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { orderService } from '../../services/orderService';

import { formatCurrency } from '../../utils/format';

type PeriodFilter = '7d' | '30d' | '90d' | '12m' | 'all';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '12m', label: '12 meses' },
  { value: 'all', label: 'Tudo' },
];

function getPeriodStartDate(period: PeriodFilter): Date | null {
  if (period === 'all') return null;

  const date = new Date();

  if (period === '7d') date.setDate(date.getDate() - 7);
  if (period === '30d') date.setDate(date.getDate() - 30);
  if (period === '90d') date.setDate(date.getDate() - 90);
  if (period === '12m') date.setMonth(date.getMonth() - 12);

  return date;
}

export function DashboardPage(): React.JSX.Element {
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [categoryId, setCategoryId] = useState<string>('all');

  const products = productService.getAll();
  const categories = categoryService.getAll();
  const orders = orderService.getAll();

  // Pedidos cancelados não entram nos indicadores financeiros.
  const validOrders = orders.filter((order) => order.status !== 'cancelled');

  const periodStart = useMemo(() => getPeriodStartDate(period), [period]);

  const periodOrders = useMemo(() => {
    if (!periodStart) return validOrders;

    return validOrders.filter(
      (order) => new Date(order.createdAt) >= periodStart,
    );
  }, [validOrders, periodStart]);

  const deliveredOrders = periodOrders.filter(
    (order) => order.status === 'delivered',
  );

  const activeOrders = periodOrders.filter((order) =>
    [
      'pending',
      'sent',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
    ].includes(order.status),
  );

  const revenue = periodOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  const averageTicket =
    periodOrders.length > 0 ? revenue / periodOrders.length : 0;

  const activeProducts = products.filter((product) => product.available).length;

  /*
   * PRODUTOS MAIS VENDIDOS
   * (respeita o período e a categoria selecionados)
   */
  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();

    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          categoryId !== 'all' &&
          item.product.categoryId !== categoryId
        ) {
          return;
        }

        const current = counts.get(item.product.name) ?? 0;
        counts.set(item.product.name, current + item.quantity);
      });
    });

    return counts;
  }, [periodOrders, categoryId]);

  const topProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topMax = Math.max(1, ...topProducts.map(([, quantity]) => quantity));

  /*
   * ÚLTIMOS 6 MESES
   * (o gráfico mensal continua olhando 6 meses fixos,
   * independente do filtro de período, para dar contexto histórico)
   */
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = date.getMonth();

    const total = validOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === year && orderDate.getMonth() === month
        );
      })
      .reduce((sum, order) => sum + Number(order.total), 0);

    return {
      key: `${year}-${month}`,
      label: date
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', ''),
      total,
    };
  });

  const monthMax = Math.max(1, ...months.map((month) => month.total));

  const mainCards = [
    {
      label: 'Faturamento',
      value: formatCurrency(revenue),
      description: 'Pedidos não cancelados no período',
      icon: CircleDollarSign,
    },
    {
      label: 'Pedidos',
      value: periodOrders.length,
      description: 'No período selecionado',
      icon: ShoppingBag,
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(averageTicket),
      description: 'Por pedido válido',
      icon: TrendingUp,
    },
    {
      label: 'Em andamento',
      value: activeOrders.length,
      description: 'Pedidos em atendimento',
      icon: Clock3,
    },
  ];

  return (
    <div>
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral da operação da loja.
          </p>
        </div>

        {/* FILTRO DE PERÍODO */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option.value === period;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'var(--primary)'
                    : 'transparent',
                  color: isActive ? 'white' : '#64748b',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* INDICADORES PRINCIPAIS */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mainCards.map(({ label, value, description, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <strong className="mt-2 block text-2xl font-bold text-slate-900">
                  {value}
                </strong>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  color: 'var(--primary)',
                  backgroundColor:
                    'color-mix(in srgb, var(--primary) 10%, white)',
                }}
              >
                <Icon size={20} />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* RESUMO OPERACIONAL */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Package size={19} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Produtos ativos</p>
            <strong className="text-lg text-slate-900">
              {activeProducts}
              <span className="ml-1 text-xs font-normal text-slate-400">
                / {products.length}
              </span>
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Tags size={19} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Categorias</p>
            <strong className="text-lg text-slate-900">
              {categories.length}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <CheckCircle2 size={19} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Entregues</p>
            <strong className="text-lg text-slate-900">
              {deliveredOrders.length}
            </strong>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* PRODUTOS MAIS VENDIDOS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <h2 className="font-bold text-slate-900">Mais vendidos</h2>
                <p className="text-xs text-slate-500">
                  Quantidade vendida por produto
                </p>
              </div>
            </div>

            {/* FILTRO DE CATEGORIA */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 outline-none"
              >
                <option value="all">Todas categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {topProducts.length > 0 ? (
            <div className="mt-6 space-y-5">
              {topProducts.map(([name, quantity], index) => (
                <div key={name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-700">
                        {name}
                      </span>
                    </div>

                    <strong className="text-sm text-slate-900">
                      {quantity}
                    </strong>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(quantity / topMax) * 100}%`,
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package size={30} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">
                Nenhuma venda encontrada para este filtro.
              </p>
            </div>
          )}
        </section>

        {/* FATURAMENTO MENSAL */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">Faturamento mensal</h2>
            <p className="mt-1 text-xs text-slate-500">Últimos 6 meses</p>
          </div>

          <div className="mt-8 flex h-64 items-end gap-3">
            {months.map((month) => {
              const percentage =
                month.total > 0
                  ? Math.max(6, (month.total / monthMax) * 100)
                  : 2;

              return (
                <div
                  key={month.key}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <div className="mb-2 hidden text-center text-[10px] font-semibold text-slate-500 sm:block">
                    {month.total > 0 ? formatCurrency(month.total) : ''}
                  </div>

                  <div className="flex h-[190px] items-end">
                    <div
                      title={`${month.label}: ${formatCurrency(month.total)}`}
                      className="mx-auto w-full max-w-12 rounded-t-lg transition-all"
                      style={{
                        height: `${percentage}%`,
                        backgroundColor: 'var(--primary)',
                        opacity: month.total > 0 ? 1 : 0.15,
                      }}
                    />
                  </div>

                  <span className="mt-2 truncate text-center text-xs capitalize text-slate-500">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}