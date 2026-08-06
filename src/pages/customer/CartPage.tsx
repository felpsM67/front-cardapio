import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, MapPin, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { cepService } from '../../services/cepService';
import { formatPhone, onlyDigits } from '../../utils/format';

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
  const { customer, setCustomer } = useAuth();
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
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(() =>
    customer?.phone ? formatPhone(customer.phone) : '',
  );
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const digits = onlyDigits(address.cep);
    if (!editing || digits.length !== 8) {
      if (digits.length < 8) setCepError('');
      return;
    }

    const timer = window.setTimeout(async () => {
      setCepLoading(true);
      setCepError('');
      try {
        const result = await cepService.find(digits);
        setAddress((current) => ({
          ...current,
          cep: result.cep || current.cep,
          street: result.logradouro || current.street,
          complement: current.complement,
          district: result.bairro || current.district,
          city: result.localidade || current.city,
          state: result.uf || current.state,
        }));
      } catch (error) {
        setCepError(error instanceof Error ? error.message : 'Erro ao consultar CEP.');
      } finally {
        setCepLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [address.cep, editing]);

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
  const currentCustomer = customer;

const set = (
  key: keyof Address,
  value: string | boolean,
): void => {
  setAddress((current) => ({
    ...current,
    [key]: value,
  }) as Address);
};

function startPhoneEdit(): void {
  setPhoneDraft(
    formatPhone(currentCustomer.phone),
  );

  setPhoneError('');
  setEditingPhone(true);
}

function cancelPhoneEdit(): void {
  setPhoneDraft(
    formatPhone(currentCustomer.phone),
  );

  setPhoneError('');
  setEditingPhone(false);
}

function savePhoneEdit(): void {
  const digits = onlyDigits(phoneDraft);

  if (
    digits.length < 10 ||
    digits.length > 11
  ) {
    setPhoneError(
      'Informe um telefone válido com DDD.',
    );

    return;
  }

  const updatedCustomer = {
    ...currentCustomer,
    phone: formatPhone(digits),
  };

  storageService.set(
    STORAGE_KEYS.CUSTOMER,
    updatedCustomer,
  );

  setCustomer(updatedCustomer);
  setPhoneDraft(updatedCustomer.phone);
  setPhoneError('');
  setEditingPhone(false);
}
function saveAddress(): void {
  if (
    !address.cep ||
    !address.street ||
    !address.number ||
    !address.district ||
    !address.city ||
    !address.state
  ) {
    alert(
      'Preencha CEP, rua, número, bairro, cidade e estado.',
    );
    return;
  }

  persistCheckoutAddress(address);

  addressService.saveLast(
    currentCustomer.phone,
    address,
  );

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Etapa 2 de 3
          </p>
          <h1 className="mt-2 text-3xl font-black">Carrinho</h1>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-bold shadow-sm transition hover:bg-slate-50"
          style={{ color: 'var(--primary)', borderColor: 'color-mix(in srgb, var(--primary) 35%, white)' }}
        >
          <ArrowLeft size={17} />
          Continuar comprando
        </Link>
      </div>
      <div className="mt-2 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Dados do cliente
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pedido de <strong>{customer.name}</strong>
            </p>
          </div>

          {!editingPhone && (
            <button
              type="button"
              onClick={startPhoneEdit}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold hover:bg-orange-50"
              style={{ color: 'var(--primary)' }}
            >
              <Pencil size={15} />
              Corrigir telefone
            </button>
          )}
        </div>

        {editingPhone ? (
          <div className="mt-3">
            <Input
              autoFocus
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(xx)xxxxx-xxxx"
              value={phoneDraft}
              onChange={(event) => {
                setPhoneDraft(formatPhone(event.target.value));
                setPhoneError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  savePhoneEdit();
                }

                if (event.key === 'Escape') {
                  cancelPhoneEdit();
                }
              }}
              maxLength={15}
            />

            {phoneError && (
              <p className="mt-1 text-sm font-semibold text-red-600">
                {phoneError}
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={savePhoneEdit}>
                Salvar telefone
              </Button>
              <button
                type="button"
                onClick={cancelPhoneEdit}
                className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-base font-bold text-slate-800">
            {formatPhone(customer.phone)}
          </p>
        )}
      </div>

      {minimumOrder && (
        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs ${
            minimumReached
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <span>Pedido mínimo: {formatCurrency(minimumOrder)}</span>
          <strong>
            {minimumReached
              ? 'Mínimo atingido'
              : `Faltam ${formatCurrency(amountMissing)}`}
          </strong>
        </div>
      )}

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
            <div>
              <div className="relative">
                <Input
                  placeholder="CEP *"
                  inputMode="numeric"
                  maxLength={9}
                  value={address.cep}
                  onChange={(event) => {
                    const digits = onlyDigits(event.target.value).slice(0, 8);
                    const formatted = digits.replace(/(\d{5})(\d)/, '$1-$2');
                    set('cep', formatted);
                  }}
                  className="pr-11"
                />
                {cepLoading && <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={20} />}
              </div>
              {cepError && <small className="mt-1 block font-semibold text-red-600">{cepError}</small>}
              {!cepError && address.street && <small className="mt-1 block font-semibold text-emerald-600">Endereço preenchido pelo CEP</small>}
            </div>
            <Input
              className="sm:col-span-2"
              placeholder="Rua *"
              value={address.street}
              onChange={(event) => set('street', event.target.value)}
            />
            <Input
              placeholder="Número da casa *"
              inputMode="numeric"
              value={address.number}
              onChange={(event) =>
                set('number', onlyDigits(event.target.value).slice(0, 10))
              }
            />
            <Input
              placeholder="Complemento (opcional)"
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
