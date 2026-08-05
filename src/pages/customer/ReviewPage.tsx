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

export function ReviewPage() {
  const cart = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] =
    useState(true);

  const [error, setError] = useState('');

  const [minimumOrder, setMinimumOrder] =
    useState<number | null>(null);

  const [deliveryFee, setDeliveryFee] =
    useState(0);

  const address =
    storageService.get<Address | null>(
      STORAGE_KEYS.CHECKOUT_ADDRESS,
      null,
    );

  const payment =
    storageService.get<Payment | null>(
      STORAGE_KEYS.CHECKOUT_PAYMENT,
      null,
    );

  const storedCustomer =
    storageService.get<Customer | null>(
      STORAGE_KEYS.CUSTOMER,
      null,
    );

  const confirmedCustomer =
    customer ?? storedCustomer;

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        setLoadingConfig(true);

        const config =
          await configService.get();

        applyConfig(config);
      } catch (configError) {
        console.error(
          'Erro ao carregar configurações:',
          configError,
        );

        setError(
          'Não foi possível carregar a taxa de entrega.',
        );
      } finally {
        setLoadingConfig(false);
      }
    }

    function applyConfig(
      config: StoreConfig,
    ): void {
      const configuredMinimum =
        config.minimumOrder !== null &&
        Number(config.minimumOrder) > 0
          ? Number(config.minimumOrder)
          : null;

      setMinimumOrder(configuredMinimum);

      setDeliveryFee(
        Number(config.deliveryFee) || 0,
      );
    }

    function handleConfigUpdate(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<StoreConfig>;

      if (customEvent.detail) {
        applyConfig(customEvent.detail);
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

  const amountMissing = minimumOrder
    ? Math.max(
        minimumOrder - cart.subtotal,
        0,
      )
    : 0;

  const minimumReached =
    !minimumOrder || amountMissing === 0;

  const total = Number(
    (
      Number(cart.subtotal) +
      Number(deliveryFee)
    ).toFixed(2),
  );

  if (
    !confirmedCustomer ||
    !address ||
    !payment
  ) {
    return (
      <div className="p-10 text-center">
        Dados do checkout incompletos.
      </div>
    );
  }

  async function finish(): Promise<void> {
    setError('');
    if (!confirmedCustomer || !address || !payment) {
    setError('Dados do checkout incompletos.');
    return;
  }
    if (loadingConfig) {
      setError(
        'Aguarde o carregamento das configurações.',
      );
      return;
    }

    if (!minimumReached) {
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
        customer: confirmedCustomer,
        address,
        items: cart.items,
        subtotal: Number(cart.subtotal),
        deliveryFee,
        discount: 0,
        total,
        payment,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const savedOrder =
        await orderService.create(order);

      cart.clear();

      storageService.remove(
        STORAGE_KEYS.CHECKOUT_ADDRESS,
      );

      storageService.remove(
        STORAGE_KEYS.CHECKOUT_PAYMENT,
      );

      navigate('/pedido/sucesso', {
        replace: true,
        state: {
          orderId: String(savedOrder.id),
        },
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Não foi possível salvar o pedido: ${saveError.message}`
          : 'Não foi possível salvar o pedido no backend.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">
        Revise seu pedido
      </h1>

      <div className="mt-6 space-y-4">
        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">
            Cliente
          </h2>

          <p>
            {confirmedCustomer.name} ·{' '}
            {confirmedCustomer.phone}
          </p>
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">
            Entrega
          </h2>

          <p>
            {address.street}, {address.number}
            {' — '}
            {address.district},{' '}
            {address.city}/{address.state}
          </p>

          {address.complement && (
            <p className="text-sm text-slate-500">
              Complemento: {address.complement}
            </p>
          )}

          {address.reference && (
            <p className="text-sm text-slate-500">
              Referência: {address.reference}
            </p>
          )}
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">
            Itens
          </h2>

          <div className="mt-3 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="border-b pb-3 last:border-b-0"
              >
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">
                    {item.quantity}x{' '}
                    {item.product.name}
                  </span>

                  <span className="font-bold">
                    {formatCurrency(
                      item.quantity *
                        item.unitPrice,
                    )}
                  </span>
                </div>

                {item.selectedOptions?.length > 0 && (
                  <div className="mt-2 pl-3 text-sm text-slate-500">
                    {item.selectedOptions.map(
                      (option) => (
                        <p key={option.id}>
                          + {option.quantity ?? 1}x{' '}
                          {option.name}
                          {Number(option.price) > 0
                            ? ` — ${formatCurrency(
                                Number(
                                  option.price,
                                ) *
                                  Number(
                                    option.quantity ??
                                      1,
                                  ),
                              )}`
                            : ''}
                        </p>
                      ),
                    )}
                  </div>
                )}

                {item.notes && (
                  <p className="mt-2 text-sm text-slate-500">
                    Observação: {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>

              <strong>
                {formatCurrency(
                  cart.subtotal,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Taxa de entrega</span>

              <strong>
                {loadingConfig
                  ? 'Carregando...'
                  : formatCurrency(
                      deliveryFee,
                    )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3 text-xl">
              <strong>Total</strong>

              <strong
                style={{
                  color: 'var(--primary)',
                }}
              >
                {formatCurrency(total)}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {!minimumReached && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Pedido mínimo de{' '}
          {formatCurrency(
            minimumOrder ?? 0,
          )}
          . Adicione mais{' '}
          {formatCurrency(amountMissing)} ao
          carrinho para finalizar.
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}

          <p className="mt-1 font-normal">
            O pedido não foi salvo e o
            carrinho foi mantido.
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
        onClick={() => void finish()}
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
    </div>
  );
}