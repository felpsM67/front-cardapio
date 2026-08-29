import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  Payment,
  PaymentMethod,
} from '../../models';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { STORAGE_KEYS } from '../../constants/storage';
import { useCart } from '../../contexts/CartContext';
import { configService } from '../../services/configService';
import { storageService } from '../../services/storageService';
import { formatCurrency } from '../../utils/format';

export function PaymentPage() {
  const deliveryType = storageService.get<'delivery' | 'pickup'>(
    STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
    'delivery',
  );
  const [method, setMethod] =
    useState<PaymentMethod>('pix');

  const [needsChange, setNeedsChange] =
    useState(false);

  const [changeFor, setChangeFor] =
    useState('');

  const [deliveryFee, setDeliveryFee] =
    useState(0);

  const [pixKey, setPixKey] =
    useState('');

  const [loadingConfig, setLoadingConfig] =
    useState(true);

  const navigate = useNavigate();
  const cart = useCart();

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const config =
          await configService.get();

        setDeliveryFee(
          Number(config.deliveryFee) || 0,
        );

        setPixKey(config.pixKey ?? '');
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      } finally {
        setLoadingConfig(false);
      }
    }

    void loadConfig();
  }, []);

  const checkoutDeliveryFee =
    deliveryType === 'delivery' ? deliveryFee : 0;

  const total =
    Number(cart.subtotal) + checkoutDeliveryFee;

  function next(): void {
    const amount = Number(
      changeFor.replace(',', '.'),
    );

    if (
      method === 'cash' &&
      needsChange &&
      (!Number.isFinite(amount) ||
        amount <= total)
    ) {
      alert(
        'O valor para troco deve ser maior que o total.',
      );
      return;
    }

    const payment: Payment = {
      method,

      needsChange:
        method === 'cash'
          ? needsChange
          : undefined,

      changeFor:
        method === 'cash' && needsChange
          ? amount
          : undefined,
    };

    storageService.set(
      STORAGE_KEYS.CHECKOUT_PAYMENT,
      payment,
    );

    navigate('/checkout/revisao');
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-black">
        Pagamento
      </h1>

      <div className="mt-6 space-y-3">
        {(
          [
            'pix',
            'cash',
            'credit',
            'debit',
          ] as PaymentMethod[]
        ).map((paymentMethod) => (
          <label
            key={paymentMethod}
            className={`block rounded-2xl border p-4 ${
              method === paymentMethod
                ? 'border-brand-600 bg-orange-50'
                : ''
            }`}
          >
            <input
              type="radio"
              checked={method === paymentMethod}
              onChange={() =>
                setMethod(paymentMethod)
              }
              className="mr-3"
            />

            {paymentMethod === 'pix'
              ? 'Pix'
              : paymentMethod === 'cash'
                ? 'Dinheiro'
                : paymentMethod === 'credit'
                  ? 'Cartão de crédito'
                  : 'Cartão de débito'}
          </label>
        ))}
      </div>

      {method === 'pix' && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
          O Pix será combinado pelo WhatsApp.
          Chave:{' '}
          <strong>
            {loadingConfig
              ? 'Carregando...'
              : pixKey || 'Não informada'}
          </strong>
        </div>
      )}

      {method === 'cash' && (
        <div className="mt-5 space-y-3">
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={needsChange}
              onChange={(event) =>
                setNeedsChange(
                  event.target.checked,
                )
              }
            />

            Preciso de troco
          </label>

          {needsChange && (
            <Input
              placeholder="Troco para quanto?"
              value={changeFor}
              onChange={(event) =>
                setChangeFor(
                  event.target.value,
                )
              }
            />
          )}

          <p className="text-sm text-slate-500">
            Total do pedido:{' '}
            {formatCurrency(total)}
          </p>
        </div>
      )}

      {(method === 'credit' ||
        method === 'debit') && (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
          O pagamento será realizado na{' '}
          {deliveryType === 'pickup' ? 'retirada' : 'entrega'} com a máquina de cartão.
        </p>
      )}

      <Button
        className="mt-6 w-full"
        disabled={loadingConfig}
        onClick={next}
      >
        {loadingConfig
          ? 'Carregando...'
          : 'Revisar pedido'}
      </Button>
    </div>
  );
}
