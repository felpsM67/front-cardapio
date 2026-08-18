import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { useCart } from '../../contexts/CartContext';

import { formatCurrency } from '../../utils/format';

import { configService } from '../../services/configService';

import { Button } from '../../components/common/Button';

import type { StoreConfig } from '../../models';

import { CheckoutSteps } from '../../components/common/CheckoutSteps';  

export function CartPage(): React.JSX.Element {
  const cart = useCart();

  const navigate =
    useNavigate();

  const [
    minimumOrder,
    setMinimumOrder,
  ] =
    useState<number | null>(
      null,
    );

  const [
    configLoading,
    setConfigLoading,
  ] =
    useState(true);

  useEffect(() => {
    function applyConfig(
      config: StoreConfig,
    ): void {
      setMinimumOrder(
        config.minimumOrder !==
          null &&
          Number(
            config.minimumOrder,
          ) > 0
          ? Number(
              config.minimumOrder,
            )
          : null,
      );
    }

    async function loadConfig(): Promise<void> {
      try {
        setConfigLoading(true);

        applyConfig(
          await configService.get(),
        );
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      } finally {
        setConfigLoading(false);
      }
    }

    function handleConfigUpdate(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<StoreConfig>;

      if (
        customEvent.detail
      ) {
        applyConfig(
          customEvent.detail,
        );
      }
    }

    void loadConfig();

    window.addEventListener(
      'store-config-updated',
      handleConfigUpdate,
    );

    return () => {
      window.removeEventListener(
        'store-config-updated',
        handleConfigUpdate,
      );
    };
  }, []);

  const amountMissing =
    minimumOrder
      ? Math.max(
          minimumOrder -
            cart.subtotal,
          0,
        )
      : 0;

  const minimumReached =
    !minimumOrder ||
    amountMissing === 0;

  function next(): void {
    if (configLoading) {
      return;
    }

    if (!minimumReached) {
      alert(
        `Faltam ${formatCurrency(
          amountMissing,
        )} para atingir o pedido mínimo.`,
      );

      return;
    }

    navigate(
      '/identificacao',
      {
        state: {
          from:
            '/checkout/endereco',
        },
      },
    );
  }

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="surface-card flex flex-col items-center p-10 text-center sm:p-14">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShoppingBag
              size={26}
            />
          </span>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Seu carrinho está vazio
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Escolha seus itens favoritos
            para continuar.
          </p>

          <Link
            to="/"
            className="mt-5 rounded-xl px-5 py-3 font-bold text-white"
            style={{
              backgroundColor:
                'var(--primary)',
            }}
          >
            Ver cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CheckoutSteps
        current={1}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Etapa 1
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Seu carrinho
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Confira os itens antes de
            continuar com seus dados.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft
            size={16}
          />

          Continuar comprando
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section>
          <h2 className="mb-3 text-xl font-black text-slate-900">
            Seus itens
          </h2>

          <div className="space-y-3">
            {cart.items.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="surface-card flex gap-4 p-4"
                >
                  {item.product
                    .imageUrl ? (
                    <img
                      src={
                        item
                          .product
                          .imageUrl
                      }
                      alt={
                        item
                          .product
                          .name
                      }
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-slate-900">
                        {
                          item
                            .product
                            .name
                        }
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          cart.remove(
                            item.id,
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remover ${item.product.name}`}
                      >
                        <Trash2
                          size={
                            17
                          }
                        />
                      </button>
                    </div>

                    {item
                      .selectedOptions
                      .length >
                      0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.selectedOptions
                          .map(
                            (
                              option,
                            ) =>
                              `${
                                option.quantity ??
                                1
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
                      <p className="mt-1 text-xs italic text-slate-500">
                        “
                        {
                          item.notes
                        }
                        ”
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1">
                        <button
                          type="button"
                          onClick={() =>
                            cart.update(
                              item.id,
                              item.quantity -
                                1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                          aria-label={`Diminuir quantidade de ${item.product.name}`}
                        >
                          <Minus
                            size={
                              15
                            }
                          />
                        </button>

                        <b className="min-w-6 text-center text-sm">
                          {
                            item.quantity
                          }
                        </b>

                        <button
                          type="button"
                          onClick={() =>
                            cart.update(
                              item.id,
                              item.quantity +
                                1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                          aria-label={`Aumentar quantidade de ${item.product.name}`}
                        >
                          <Plus
                            size={
                              15
                            }
                          />
                        </button>
                      </div>

                      <strong className="text-slate-900">
                        {formatCurrency(
                          item.unitPrice *
                            item.quantity,
                        )}
                      </strong>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <aside className="surface-card h-fit p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-black text-slate-900">
            Resumo
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  cart.subtotal,
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">
                Recebimento
              </span>

              <strong className="text-right text-slate-600">
                Escolher depois
              </strong>
            </div>
          </div>

          <div className="my-5 border-t border-slate-200" />

          <div className="flex items-end justify-between gap-3">
            <span className="font-bold text-slate-700">
              Parcial
            </span>

            <strong
              className="text-2xl font-black"
              style={{
                color:
                  'var(--primary)',
              }}
            >
              {formatCurrency(
                cart.subtotal,
              )}
            </strong>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            A taxa de entrega será
            calculada depois que você
            escolher entre entrega ou
            retirada.
          </p>

          {minimumOrder && (
            <div
              className={`mt-5 rounded-xl border p-3 text-xs ${
                minimumReached
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {minimumReached ? (
                <strong>
                  Pedido mínimo
                  atingido.
                </strong>
              ) : (
                <>
                  Pedido mínimo
                  de{' '}
                  <strong>
                    {formatCurrency(
                      minimumOrder,
                    )}
                  </strong>
                  . Faltam{' '}
                  <strong>
                    {formatCurrency(
                      amountMissing,
                    )}
                  </strong>
                  .
                </>
              )}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            onClick={next}
            disabled={
              configLoading ||
              !minimumReached
            }
          >
            {configLoading
              ? 'Carregando...'
              : minimumReached
                ? 'Continuar pedido'
                : `Faltam ${formatCurrency(
                    amountMissing,
                  )}`}
          </Button>

          <Link
            to="/"
            className="mt-3 block text-center text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            Adicionar mais itens
          </Link>
        </aside>
      </div>
    </div>
  );
}