import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import type {
  Address,
  Customer,
  DeliveryType,
  Order,
  Payment,
  StoreConfig,
} from '../../models';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

import { storageService } from '../../services/storageService';
import { configService } from '../../services/configService';
import { orderService } from '../../services/orderService';

import { STORAGE_KEYS } from '../../constants/storage';

import { formatCurrency } from '../../utils/format';

import { Button } from '../../components/common/Button';

const pickupAddress: Address = {
  id: 'pickup',
  label: 'Casa',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  reference: '',
  isDefault: false,
};

export function ReviewPage(): React.JSX.Element {
  const cart =
    useCart();

  const {
    customer,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    loadingConfig,
    setLoadingConfig,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    minimumOrder,
    setMinimumOrder,
  ] =
    useState<number | null>(
      null,
    );

  const [
    configuredDeliveryFee,
    setConfiguredDeliveryFee,
  ] =
    useState(0);

  /*
   * TIPO DE RECEBIMENTO
   *
   * delivery = ENTREGA
   * pickup   = RETIRADA
   */
  const deliveryType =
    storageService.get<
      DeliveryType | null
    >(
      STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
      null,
    );

  const address =
    storageService.get<
      Address | null
    >(
      STORAGE_KEYS.CHECKOUT_ADDRESS,
      null,
    );

  const payment =
    storageService.get<
      Payment | null
    >(
      STORAGE_KEYS.CHECKOUT_PAYMENT,
      null,
    );

  const storedCustomer =
    storageService.get<
      Customer | null
    >(
      STORAGE_KEYS.CUSTOMER,
      null,
    );

  const confirmedCustomer =
    customer ??
    storedCustomer;

  useEffect(() => {
    function applyConfig(
      config: StoreConfig,
    ): void {
      const configuredMinimum =
        config.minimumOrder !==
          null &&
        Number(
          config.minimumOrder,
        ) > 0
          ? Number(
              config.minimumOrder,
            )
          : null;

      setMinimumOrder(
        configuredMinimum,
      );

      setConfiguredDeliveryFee(
        Number(
          config.deliveryFee,
        ) || 0,
      );
    }

    async function loadConfig(): Promise<void> {
      try {
        setLoadingConfig(
          true,
        );

        const config =
          await configService.get();

        applyConfig(
          config,
        );
      } catch (
        configError
      ) {
        console.error(
          'Erro ao carregar configurações:',
          configError,
        );

        setError(
          'Não foi possível carregar as configurações da loja.',
        );
      } finally {
        setLoadingConfig(
          false,
        );
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

  /*
   * PEDIDO MÍNIMO
   */

  const amountMissing =
    minimumOrder
      ? Math.max(
          minimumOrder -
            Number(
              cart.subtotal,
            ),
          0,
        )
      : 0;

  const minimumReached =
    !minimumOrder ||
    amountMissing === 0;

  /*
   * FRETE
   *
   * RETIRADA = R$ 0,00
   * ENTREGA = valor configurado
   */
  const deliveryFee =
    deliveryType ===
    'pickup'
      ? 0
      : configuredDeliveryFee;

  const total =
    Number(
      (
        Number(
          cart.subtotal,
        ) +
        Number(
          deliveryFee,
        )
      ).toFixed(2),
    );

  /*
   * VALIDAÇÃO DA PÁGINA
   *
   * Endereço só é obrigatório
   * quando for entrega.
   */
  const checkoutIncomplete =
    !confirmedCustomer ||
    !payment ||
    !deliveryType ||
    (
      deliveryType ===
        'delivery' &&
      !address
    );

  if (
    checkoutIncomplete
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Dados do checkout incompletos
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Volte ao carrinho e confira as informações do pedido.
        </p>

        <Button
          className="mt-5"
          onClick={() =>
            navigate(
              '/carrinho',
            )
          }
        >
          Voltar ao carrinho
        </Button>
      </div>
    );
  }

  async function finish(): Promise<void> {
    setError('');

    /*
     * Cliente, pagamento e tipo
     * são sempre obrigatórios.
     */
    if (
      !confirmedCustomer ||
      !payment ||
      !deliveryType
    ) {
      setError(
        'Dados do checkout incompletos.',
      );

      return;
    }

    /*
     * Endereço somente para entrega.
     */
    if (
      deliveryType ===
        'delivery' &&
      !address
    ) {
      setError(
        'O endereço de entrega não foi informado.',
      );

      return;
    }

    if (
      loadingConfig
    ) {
      setError(
        'Aguarde o carregamento das configurações.',
      );

      return;
    }

    if (
      !minimumReached
    ) {
      setError(
        `Faltam ${formatCurrency(
          amountMissing,
        )} para atingir o pedido mínimo.`,
      );

      return;
    }

    try {
      setSaving(true);

      const order: Order = {
        id: '',

        /*
         * IMPORTANTE:
         * vai para o orderService,
         * que converte:
         *
         * pickup   -> RETIRADA
         * delivery -> ENTREGA
         */
        deliveryType,

        customer:
          confirmedCustomer,

        /*
         * Para retirada usamos
         * endereço vazio apenas
         * para satisfazer o type
         * atual do frontend.
         *
         * O orderService enviará
         * null para o backend.
         */
        address:
          deliveryType ===
          'delivery'
            ? (address as Address)
            : pickupAddress,

        items:
          cart.items,

        subtotal:
          Number(
            cart.subtotal,
          ),

        /*
         * RETIRADA = zero
         */
        deliveryFee,

        discount: 0,

        total,

        payment,

        status:
          'pending',

        createdAt:
          new Date().toISOString(),
      };

      const savedOrder =
        await orderService.create(
          order,
        );

      cart.clear();

      storageService.remove(
        STORAGE_KEYS.CHECKOUT_ADDRESS,
      );

      storageService.remove(
        STORAGE_KEYS.CHECKOUT_PAYMENT,
      );

      storageService.remove(
        STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
      );

      navigate(
        '/pedido/sucesso',
        {
          replace: true,

          state: {
            orderId:
              String(
                savedOrder.id,
              ),

            deliveryType,
          },
        },
      );
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? `Não foi possível salvar o pedido: ${saveError.message}`
          : 'Não foi possível salvar o pedido no backend.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Revise seu pedido
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Confira as informações antes de finalizar.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {/* CLIENTE */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400">
            Cliente
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {
              confirmedCustomer.name
            }
          </p>

          <p className="mt-0.5 text-sm text-slate-500">
            {
              confirmedCustomer.phone
            }
          </p>
        </section>

        {/* RECEBIMENTO */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400">
            Recebimento
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {deliveryType ===
            'pickup'
              ? 'Retirada na loja'
              : 'Entrega'}
          </p>

          {deliveryType ===
            'pickup' && (
            <p className="mt-1 text-sm text-slate-500">
              Você será avisado quando o pedido estiver pronto.
            </p>
          )}

          {deliveryType ===
            'delivery' &&
            address && (
              <div className="mt-2 text-sm text-slate-600">
                <p>
                  {
                    address.street
                  }
                  ,{' '}
                  {
                    address.number
                  }
                  {' — '}
                  {
                    address.district
                  }
                  ,{' '}
                  {
                    address.city
                  }
                  /
                  {
                    address.state
                  }
                </p>

                {address.complement && (
                  <p className="mt-1 text-slate-500">
                    Complemento:{' '}
                    {
                      address.complement
                    }
                  </p>
                )}

                {address.reference && (
                  <p className="mt-1 text-slate-500">
                    Referência:{' '}
                    {
                      address.reference
                    }
                  </p>
                )}
              </div>
            )}
        </section>

        {/* PAGAMENTO */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400">
            Pagamento
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {payment.method ===
            'pix'
              ? 'PIX'
              : payment.method ===
                  'cash'
                ? 'Dinheiro'
                : payment.method ===
                    'credit'
                  ? 'Cartão de crédito'
                  : 'Cartão de débito'}
          </p>

          {payment.method ===
            'cash' &&
            payment.needsChange &&
            payment.changeFor && (
              <p className="mt-1 text-sm text-slate-500">
                Troco para{' '}
                {formatCurrency(
                  payment.changeFor,
                )}
              </p>
            )}
        </section>

        {/* ITENS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">
            Itens
          </h2>

          <div className="mt-4 space-y-4">
            {cart.items.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between gap-4">
                    <span className="text-sm font-medium text-slate-800">
                      {
                        item.quantity
                      }
                      x{' '}
                      {
                        item.product
                          .name
                      }
                    </span>

                    <span className="shrink-0 text-sm font-semibold">
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
                    <div className="mt-2 pl-3 text-xs text-slate-500">
                      {item.selectedOptions.map(
                        (
                          option,
                        ) => (
                          <p
                            key={
                              option.id
                            }
                          >
                            +{' '}
                            {option.quantity ??
                              1}
                            x{' '}
                            {
                              option.name
                            }
                          </p>
                        ),
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Obs:{' '}
                      {
                        item.notes
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>

          {/* TOTAIS */}

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span>
                {formatCurrency(
                  cart.subtotal,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">
                {deliveryType ===
                'pickup'
                  ? 'Retirada'
                  : 'Taxa de entrega'}
              </span>

              <span>
                {deliveryType ===
                'pickup'
                  ? 'Grátis'
                  : loadingConfig
                    ? 'Carregando...'
                    : formatCurrency(
                        deliveryFee,
                      )}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg">
              <strong>
                Total
              </strong>

              <strong
                style={{
                  color:
                    'var(--primary)',
                }}
              >
                {formatCurrency(
                  total,
                )}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {!minimumReached && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Pedido mínimo de{' '}
          {formatCurrency(
            minimumOrder ??
              0,
          )}
          . Adicione mais{' '}
          {formatCurrency(
            amountMissing,
          )}{' '}
          ao carrinho para finalizar.
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}

          <p className="mt-1 font-normal">
            O pedido não foi salvo e o carrinho foi mantido.
          </p>
        </div>
      )}

      <Button
        className="mt-6 w-full"
        disabled={
          saving ||
          loadingConfig ||
          !minimumReached
        }
        onClick={() =>
          void finish()
        }
      >
        {saving
          ? 'Finalizando pedido...'
          : loadingConfig
            ? 'Carregando configurações...'
            : minimumReached
              ? 'Finalizar pedido'
              : `Faltam ${formatCurrency(
                  amountMissing,
                )}`}
      </Button>

      <button
        type="button"
        onClick={() =>
          navigate(
            '/checkout/pagamento',
          )
        }
        className="mt-3 w-full py-2 text-sm text-slate-500"
      >
        Voltar
      </button>
    </div>
  );
}