import {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  Banknote,
  CreditCard,
  QrCode,
  Store,
  Truck,
} from 'lucide-react';

import type {
  DeliveryType,
  Payment,
  PaymentMethod,
} from '../../models';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CheckoutSteps } from '../../components/common/CheckoutSteps';

import { STORAGE_KEYS } from '../../constants/storage';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

import { configService } from '../../services/configService';
import { storageService } from '../../services/storageService';

import { formatCurrency } from '../../utils/format';

const PAYMENT_LABEL: Record<
  PaymentMethod,
  string
> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  credit: 'Cartão de crédito',
  debit: 'Cartão de débito',
};

export function PaymentPage(): React.JSX.Element {
  const storedPayment =
    storageService.get<
      Payment | null
    >(
      STORAGE_KEYS.CHECKOUT_PAYMENT,
      null,
    );

  const deliveryType =
    storageService.get<
      DeliveryType | null
    >(
      STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
      null,
    );

  const [
    method,
    setMethod,
  ] =
    useState<PaymentMethod>(
      storedPayment?.method ??
        'pix',
    );

  const [
    needsChange,
    setNeedsChange,
  ] =
    useState(
      storedPayment?.needsChange ??
        false,
    );

  const [
    changeFor,
    setChangeFor,
  ] =
    useState(
      storedPayment?.changeFor
        ? String(
            storedPayment.changeFor,
          )
        : '',
    );

  const [
    configuredDeliveryFee,
    setConfiguredDeliveryFee,
  ] =
    useState(0);

  const [
    pixKey,
    setPixKey,
  ] =
    useState('');

  const [
    pixHolder,
    setPixHolder,
  ] =
    useState('');

  const [
    loadingConfig,
    setLoadingConfig,
  ] =
    useState(true);

  const navigate =
    useNavigate();

  const cart =
    useCart();

  const { customer } =
    useAuth();

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const config =
          await configService.get();

        setConfiguredDeliveryFee(
          Number(
            config.deliveryFee,
          ) || 0,
        );

        setPixKey(
          config.pixKey ?? '',
        );

        setPixHolder(
          config.pixHolderName ??
            '',
        );
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      } finally {
        setLoadingConfig(
          false,
        );
      }
    }

    void loadConfig();
  }, []);

  if (!cart.items.length) {
    return (
      <Navigate
        to="/carrinho"
        replace
      />
    );
  }

  if (!customer) {
    return (
      <Navigate
        to="/identificacao"
        state={{
          from:
            '/checkout/endereco',
        }}
        replace
      />
    );
  }

  if (!deliveryType) {
    return (
      <Navigate
        to="/checkout/endereco"
        replace
      />
    );
  }

  const deliveryFee =
    deliveryType ===
    'pickup'
      ? 0
      : configuredDeliveryFee;

  const total =
    Number(
      cart.subtotal,
    ) + deliveryFee;

  const placeText =
    deliveryType ===
    'pickup'
      ? 'na retirada'
      : 'na entrega';

  function next(): void {
    const amount =
      Number(
        changeFor.replace(
          ',',
          '.',
        ),
      );

    if (
      method === 'cash' &&
      needsChange &&
      (!Number.isFinite(
        amount,
      ) ||
        amount <= total)
    ) {
      alert(
        'O valor para troco deve ser maior que o total.',
      );

      return;
    }

    const payment:
      Payment = {
      method,

      needsChange:
        method === 'cash'
          ? needsChange
          : undefined,

      changeFor:
        method === 'cash' &&
        needsChange
          ? amount
          : undefined,
    };

    storageService.set(
      STORAGE_KEYS.CHECKOUT_PAYMENT,
      payment,
    );

    navigate(
      '/checkout/revisao',
    );
  }

  const paymentMethods: Array<{
    value: PaymentMethod;
    label: string;
    description: string;
    icon: typeof QrCode;
  }> = [
    {
      value: 'pix',
      label:
        PAYMENT_LABEL.pix,
      description:
        'Pagamento via chave PIX.',
      icon: QrCode,
    },

    {
      value: 'cash',
      label:
        PAYMENT_LABEL.cash,
      description: `Pagamento em dinheiro ${placeText}.`,
      icon: Banknote,
    },

    {
      value: 'credit',
      label:
        PAYMENT_LABEL.credit,
      description: `Máquina de cartão ${placeText}.`,
      icon: CreditCard,
    },

    {
      value: 'debit',
      label:
        PAYMENT_LABEL.debit,
      description: `Máquina de cartão ${placeText}.`,
      icon: CreditCard,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <CheckoutSteps
        current={4}
      />

      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        Etapa 4
      </p>

      <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
        Como deseja pagar?
      </h1>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {deliveryType ===
        'pickup' ? (
          <Store
            size={18}
          />
        ) : (
          <Truck
            size={18}
          />
        )}

        <span>
          {deliveryType ===
          'pickup'
            ? 'Retirada na loja · sem taxa de entrega'
            : `Entrega · ${formatCurrency(
                deliveryFee,
              )}`}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {paymentMethods.map(
          ({
            value,
            label,
            description,
            icon: Icon,
          }) => {
            const active =
              method === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setMethod(
                    value,
                  )
                }
                className={`surface-card flex items-start gap-3 p-4 text-left transition ${
                  active
                    ? 'primary-border primary-soft'
                    : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    color:
                      active
                        ? 'var(--primary)'
                        : '#64748b',

                    backgroundColor:
                      active
                        ? 'color-mix(in srgb, var(--primary) 12%, white)'
                        : '#f1f5f9',
                  }}
                >
                  <Icon
                    size={19}
                  />
                </span>

                <span>
                  <strong className="block text-slate-900">
                    {label}
                  </strong>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {
                      description
                    }
                  </span>
                </span>
              </button>
            );
          },
        )}
      </div>

      {method ===
        'pix' && (
        <div className="surface-card mt-5 p-5">
          <p className="text-sm text-slate-500">
            Chave PIX
          </p>

          <strong className="mt-1 block break-all text-slate-900">
            {loadingConfig
              ? 'Carregando...'
              : pixKey ||
                'Não informada'}
          </strong>

          {!loadingConfig &&
            pixHolder && (
              <p className="mt-1 text-xs text-slate-500">
                Titular:{' '}
                {pixHolder}
              </p>
            )}
        </div>
      )}

      {method ===
        'cash' && (
        <div className="surface-card mt-5 space-y-4 p-5">
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={
                needsChange
              }
              onChange={(
                event,
              ) =>
                setNeedsChange(
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4"
            />

            Preciso de troco
          </label>

          {needsChange && (
            <Input
              inputMode="decimal"
              placeholder="Troco para quanto? Ex.: 100"
              value={
                changeFor
              }
              onChange={(
                event,
              ) =>
                setChangeFor(
                  event.target
                    .value,
                )
              }
            />
          )}
        </div>
      )}

      <div className="surface-card mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">
            Total do pedido
          </span>

          <strong
            className="text-2xl font-black"
            style={{
              color:
                'var(--primary)',
            }}
          >
            {loadingConfig
              ? '—'
              : formatCurrency(
                  total,
                )}
          </strong>
        </div>

        <Button
          className="mt-5 w-full"
          disabled={
            loadingConfig
          }
          onClick={next}
        >
          {loadingConfig
            ? 'Carregando...'
            : 'Revisar pedido'}
        </Button>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/checkout/endereco',
            )
          }
          className="mt-3 w-full text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          Voltar para recebimento
        </button>
      </div>
    </div>
  );
}