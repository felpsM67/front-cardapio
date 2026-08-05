import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { MapPin, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/format';
import { configService } from '../../services/configService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import type { Address } from '../../models';
import { STORAGE_KEYS } from '../../constants/storage';
import { storageService } from '../../services/storageService';
import { addressService } from '../../services/addressService';

const blankAddress: Address = {
  id: 'checkout-address',
  label: 'Casa',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: 'Dourados',
  state: 'MS',
  reference: '',
  isDefault: true,
};

export function CartPage() {
  const cart = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [minimumOrder, setMinimumOrder] =
  useState<number | null>(null);

const [deliveryFee, setDeliveryFee] =
  useState(0);

useEffect(() => {
  async function loadConfig(): Promise<void> {
    try {
      const config = await configService.get();

      setMinimumOrder(
        config.minimumOrder !== null &&
          config.minimumOrder > 0
          ? config.minimumOrder
          : null,
      );

      setDeliveryFee(
        Number(config.deliveryFee) || 0,
      );
    } catch (error) {
      console.error(
        'Erro ao carregar configurações:',
        error,
      );
    }
  }

  function handleConfigUpdate(): void {
    void loadConfig();
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
    ? Math.max(minimumOrder - cart.subtotal, 0)
    : 0;
  const minimumProgress = minimumOrder
    ? Math.min((cart.subtotal / minimumOrder) * 100, 100)
    : 100;
  const minimumReached = !minimumOrder || amountMissing === 0;

  const [address, setAddress] = useState<Address>(() => {
    const checkoutAddress = storageService.get<Address | null>(
      STORAGE_KEYS.CHECKOUT_ADDRESS,
      null,
    );

    if (checkoutAddress) return checkoutAddress;
    if (customer) return addressService.getLast(customer.phone) ?? blankAddress;
    return blankAddress;
  });
  const [editing, setEditing] = useState(() => !address.street);

  function persistCheckoutAddress(nextAddress: Address) {
    if (
      !nextAddress.cep ||
      !nextAddress.street ||
      !nextAddress.number ||
      !nextAddress.district ||
      !nextAddress.city ||
      !nextAddress.state
    ) {
      return;
    }

    storageService.set(STORAGE_KEYS.CHECKOUT_ADDRESS, nextAddress);
  }

  useEffect(() => {
    if (!editing && address.street) {
      persistCheckoutAddress(address);
    }
  }, [address, editing]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black">Seu carrinho está vazio</h1>
        <Link
          to="/"
          className="mt-5 inline-block"
          style={{ color: 'var(--primary)' }}
        >
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <Navigate
        to="/identificacao"
        state={{ from: '/carrinho' }}
        replace
      />
    );
  }

  const set = (key: keyof Address, value: string | boolean) => {
    setAddress((current) => ({ ...current, [key]: value } as Address));
  };

  function saveAddress() {
    if (
      !address.cep ||
      !address.street ||
      !address.number ||
      !address.district ||
      !address.city ||
      !address.state
    ) {
      alert('Preencha CEP, rua, número, bairro, cidade e estado.');
      return;
    }

    persistCheckoutAddress(address);
    if (customer) {
      addressService.saveLast(customer.phone, address);
    }
    setEditing(false);
  }

  function next() {
    if (!minimumReached) {
      alert(
        `Faltam ${formatCurrency(amountMissing)} para atingir o pedido mínimo.`,
      );
      return;
    }

    if (editing || !address.street) {
      alert('Salve o endereço de entrega antes de continuar.');
      return;
    }

    persistCheckoutAddress(address);
    navigate('/checkout/pagamento');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
        Etapa 2 de 3
      </p>
      <h1 className="mt-2 text-3xl font-black">Carrinho</h1>
      <p className="mt-2 text-sm text-slate-500">
        Pedido de <strong>{customer.name}</strong> · {customer.phone}
      </p>

      <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className="font-black">Endereço de entrega</h2>
              <p className="text-sm text-slate-500">
                Confirme onde o pedido será entregue.
              </p>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex shrink-0 items-center gap-1 text-sm font-bold"
              style={{ color: 'var(--primary)' }}
            >
              <Pencil size={16} />
              Modificar
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={address.label}
              onChange={(event) => set('label', event.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option>Casa</option>
              <option>Apartamento</option>
              <option>Trabalho</option>
            </select>
            <Input
              placeholder="CEP *"
              value={address.cep}
              onChange={(event) => set('cep', event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Rua *"
              value={address.street}
              onChange={(event) => set('street', event.target.value)}
            />
            <Input
              placeholder="Número *"
              value={address.number}
              onChange={(event) => set('number', event.target.value)}
            />
            <Input
              placeholder="Complemento"
              value={address.complement ?? ''}
              onChange={(event) => set('complement', event.target.value)}
            />
            <Input
              placeholder="Bairro *"
              value={address.district}
              onChange={(event) => set('district', event.target.value)}
            />
            <Input
              placeholder="Cidade *"
              value={address.city}
              onChange={(event) => set('city', event.target.value)}
            />
            <Input
              placeholder="Estado *"
              value={address.state}
              onChange={(event) => set('state', event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Ponto de referência"
              value={address.reference ?? ''}
              onChange={(event) => set('reference', event.target.value)}
            />
            <Button
              type="button"
              className="sm:col-span-2"
              onClick={saveAddress}
            >
              Salvar endereço
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <b>{address.label}</b>
            <p>
              {address.street}, {address.number}
              {address.complement ? ` — ${address.complement}` : ''}
            </p>
            <p>
              {address.district}, {address.city}/{address.state} · CEP{' '}
              {address.cep}
            </p>
            {address.reference && (
              <p className="mt-1 text-slate-500">
                Referência: {address.reference}
              </p>
            )}
          </div>
        )}
      </section>

      <h2 className="mt-8 text-xl font-black">Seu pedido</h2>
      <div className="mt-3 space-y-3">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-2xl border bg-white p-3"
          >
            <img
              src={item.product.imageUrl}
              alt={item.product.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <b>{item.product.name}</b>
              {item.selectedOptions.length > 0 && (
                <p className="text-xs text-slate-500">
                  {item.selectedOptions
                    .map((option) => `${option.quantity ?? 1}x ${option.name}`)
                    .join(', ')}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-slate-500">Obs.: {item.notes}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cart.update(item.id, item.quantity - 1)}
                    aria-label={`Diminuir quantidade de ${item.product.name}`}
                  >
                    <Minus size={18} />
                  </button>
                  <b>{item.quantity}</b>
                  <button
                    type="button"
                    onClick={() => cart.update(item.id, item.quantity + 1)}
                    aria-label={`Aumentar quantidade de ${item.product.name}`}
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.remove(item.id)}
                    className="text-red-600"
                    aria-label={`Remover ${item.product.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {minimumOrder && (
        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-black">Pedido mínimo</h2>
              <p className="mt-1 text-sm text-slate-500">
                {minimumReached
                  ? 'Valor mínimo atingido. Você já pode continuar.'
                  : `Adicione mais ${formatCurrency(amountMissing)} ao carrinho para continuar.`}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                minimumReached
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {formatCurrency(cart.subtotal)} de {formatCurrency(minimumOrder)}
            </span>
          </div>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Progresso do pedido mínimo"
            aria-valuemin={0}
            aria-valuemax={minimumOrder}
            aria-valuenow={Math.min(cart.subtotal, minimumOrder)}
          >
            <div
              className={`h-full rounded-full transition-all ${
                minimumReached ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${minimumProgress}%` }}
            />
          </div>
        </section>
      )}

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <b>{formatCurrency(cart.subtotal)}</b>
        </div>
        <div className="mt-2 flex justify-between">
          <span>Entrega</span>
          <b>{formatCurrency(deliveryFee)}</b>
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 text-xl">
          <b>Total</b>
          <b>{formatCurrency(cart.subtotal + deliveryFee)}</b>
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        onClick={next}
        disabled={!minimumReached}
      >
        {minimumReached
          ? 'Continuar para pagamento'
          : `Faltam ${formatCurrency(amountMissing)}`}
      </Button>
    </div>
  );
}
