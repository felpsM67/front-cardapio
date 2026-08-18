import {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  LoaderCircle,
  MapPin,
  Store,
  Truck,
} from 'lucide-react';

import type {
  Address,
  DeliveryType,
  StoreConfig,
} from '../../models';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CheckoutSteps } from '../../components/common/CheckoutSteps';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

import { addressService } from '../../services/addressService';
import { cepService } from '../../services/cepService';
import { configService } from '../../services/configService';
import { storageService } from '../../services/storageService';

import { STORAGE_KEYS } from '../../constants/storage';

import {
  formatCurrency,
  onlyDigits,
} from '../../utils/format';

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

export function AddressPage(): React.JSX.Element {
  const cart = useCart();

  const { customer } =
    useAuth();

  const navigate =
    useNavigate();

  const [
    deliveryType,
    setDeliveryType,
  ] =
    useState<DeliveryType>(
      () =>
        storageService.get<DeliveryType>(
          STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
          'delivery',
        ),
    );

  const [
    address,
    setAddress,
  ] =
    useState<Address>(() => {
      const checkoutAddress =
        storageService.get<
          Address | null
        >(
          STORAGE_KEYS.CHECKOUT_ADDRESS,
          null,
        );

      if (checkoutAddress) {
        return checkoutAddress;
      }

      if (customer) {
        return (
          addressService.getLast(
            customer.phone,
          ) ??
          blankAddress
        );
      }

      return blankAddress;
    });

  const [
    cepLoading,
    setCepLoading,
  ] =
    useState(false);

  const [
    cepError,
    setCepError,
  ] =
    useState('');

  const [
    storeName,
    setStoreName,
  ] =
    useState('');

  const [
    deliveryFee,
    setDeliveryFee,
  ] =
    useState(0);

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const config:
          StoreConfig =
          await configService.get();

        setStoreName(
          config.storeName,
        );

        setDeliveryFee(
          Number(
            config.deliveryFee,
          ) || 0,
        );
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      }
    }

    void loadConfig();
  }, []);

  useEffect(() => {
    const digits =
      onlyDigits(
        address.cep,
      );

    if (
      deliveryType !==
        'delivery' ||
      digits.length !== 8
    ) {
      if (
        digits.length < 8
      ) {
        setCepError('');
      }

      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          setCepLoading(
            true,
          );

          setCepError('');

          try {
            const result =
              await cepService.find(
                digits,
              );

            setAddress(
              (current) => ({
                ...current,

                cep:
                  result.cep ||
                  current.cep,

                street:
                  result.logradouro ||
                  current.street,

                district:
                  result.bairro ||
                  current.district,

                city:
                  result.localidade ||
                  current.city,

                state:
                  result.uf ||
                  current.state,
              }),
            );
          } catch (error) {
            setCepError(
              error instanceof
                Error
                ? error.message
                : 'Erro ao consultar CEP.',
            );
          } finally {
            setCepLoading(
              false,
            );
          }
        },
        350,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    address.cep,
    deliveryType,
  ]);

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

  const currentCustomer =
    customer;

  function setAddressField(
    key: keyof Address,
    value:
      | string
      | boolean,
  ): void {
    setAddress(
      (current) =>
        ({
          ...current,
          [key]: value,
        }) as Address,
    );
  }

  function selectDeliveryType(
    type: DeliveryType,
  ): void {
    setDeliveryType(
      type,
    );

    storageService.set(
      STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
      type,
    );
  }

  function next(): void {
    storageService.set(
      STORAGE_KEYS.CHECKOUT_DELIVERY_TYPE,
      deliveryType,
    );

    if (
      deliveryType ===
      'pickup'
    ) {
      navigate(
        '/checkout/pagamento',
      );

      return;
    }

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

    storageService.set(
      STORAGE_KEYS.CHECKOUT_ADDRESS,
      address,
    );

    addressService.saveLast(
      currentCustomer.phone,
      address,
    );

    navigate(
      '/checkout/pagamento',
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <CheckoutSteps
        current={3}
      />

      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        Etapa 3
      </p>

      <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
        Como deseja receber?
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Escolha entre receber no seu
        endereço ou retirar
        diretamente na loja.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            selectDeliveryType(
              'delivery',
            )
          }
          className={`surface-card flex items-start gap-3 p-5 text-left transition ${
            deliveryType ===
            'delivery'
              ? 'primary-border primary-soft'
              : 'hover:bg-slate-50'
          }`}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              color:
                deliveryType ===
                'delivery'
                  ? 'var(--primary)'
                  : '#64748b',

              backgroundColor:
                deliveryType ===
                'delivery'
                  ? 'color-mix(in srgb, var(--primary) 12%, white)'
                  : '#f1f5f9',
            }}
          >
            <Truck
              size={21}
            />
          </span>

          <span>
            <strong className="block text-slate-900">
              Entrega
            </strong>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Receba seu pedido no
              endereço informado.
            </span>

            <span
              className="mt-2 block text-sm font-black"
              style={{
                color:
                  'var(--primary)',
              }}
            >
              {formatCurrency(
                deliveryFee,
              )}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            selectDeliveryType(
              'pickup',
            )
          }
          className={`surface-card flex items-start gap-3 p-5 text-left transition ${
            deliveryType ===
            'pickup'
              ? 'primary-border primary-soft'
              : 'hover:bg-slate-50'
          }`}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              color:
                deliveryType ===
                'pickup'
                  ? 'var(--primary)'
                  : '#64748b',

              backgroundColor:
                deliveryType ===
                'pickup'
                  ? 'color-mix(in srgb, var(--primary) 12%, white)'
                  : '#f1f5f9',
            }}
          >
            <Store
              size={21}
            />
          </span>

          <span>
            <strong className="block text-slate-900">
              Retirada na loja
            </strong>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Você busca o pedido
              quando estiver pronto.
            </span>

            <span className="mt-2 block text-sm font-black text-emerald-600">
              Grátis
            </span>
          </span>
        </button>
      </div>

      {deliveryType ===
      'delivery' ? (
        <section className="surface-card mt-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                color:
                  'var(--primary)',

                backgroundColor:
                  'color-mix(in srgb, var(--primary) 10%, white)',
              }}
            >
              <MapPin
                size={20}
              />
            </span>

            <div>
              <h2 className="font-black text-slate-900">
                Endereço de entrega
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informe onde o pedido
                deve ser entregue.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <select
              value={
                address.label
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'label',
                  event.target
                    .value,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[var(--primary)]"
            >
              <option>
                Casa
              </option>

              <option>
                Apartamento
              </option>

              <option>
                Trabalho
              </option>
            </select>

            <div>
              <div className="relative">
                <Input
                  placeholder="CEP *"
                  inputMode="numeric"
                  maxLength={9}
                  value={
                    address.cep
                  }
                  onChange={(
                    event,
                  ) => {
                    const digits =
                      onlyDigits(
                        event
                          .target
                          .value,
                      ).slice(
                        0,
                        8,
                      );

                    const formatted =
                      digits.replace(
                        /(\d{5})(\d)/,
                        '$1-$2',
                      );

                    setAddressField(
                      'cep',
                      formatted,
                    );
                  }}
                  className="pr-11"
                />

                {cepLoading && (
                  <LoaderCircle
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
                    style={{
                      color:
                        'var(--primary)',
                    }}
                    size={19}
                  />
                )}
              </div>

              {cepError && (
                <small className="mt-1 block font-semibold text-red-600">
                  {
                    cepError
                  }
                </small>
              )}
            </div>

            <Input
              className="sm:col-span-2"
              placeholder="Rua *"
              value={
                address.street
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'street',
                  event.target
                    .value,
                )
              }
            />

            <Input
              placeholder="Número *"
              value={
                address.number
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'number',
                  event.target.value.slice(
                    0,
                    20,
                  ),
                )
              }
            />

            <Input
              placeholder="Complemento (opcional)"
              value={
                address.complement ??
                ''
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'complement',
                  event.target
                    .value,
                )
              }
            />

            <Input
              placeholder="Bairro *"
              value={
                address.district
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'district',
                  event.target
                    .value,
                )
              }
            />

            <Input
              placeholder="Cidade *"
              value={
                address.city
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'city',
                  event.target
                    .value,
                )
              }
            />

            <Input
              placeholder="Estado *"
              value={
                address.state
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'state',
                  event.target
                    .value,
                )
              }
            />

            <Input
              className="sm:col-span-2"
              placeholder="Ponto de referência"
              value={
                address.reference ??
                ''
              }
              onChange={(
                event,
              ) =>
                setAddressField(
                  'reference',
                  event.target
                    .value,
                )
              }
            />
          </div>
        </section>
      ) : (
        <section className="surface-card mt-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Store
                size={20}
              />
            </span>

            <div>
              <h2 className="font-black text-slate-900">
                Retirada no balcão
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Seu pedido será
                preparado para
                retirada em{' '}

                <strong className="text-slate-700">
                  {storeName ||
                    'nossa loja'}
                </strong>

                . Você será avisado
                quando estiver
                pronto.
              </p>

              <p className="mt-2 text-sm font-bold text-emerald-600">
                Sem taxa de
                entrega.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="surface-card mt-6 p-5">
        <Button
          className="w-full"
          onClick={next}
        >
          Continuar para
          pagamento
        </Button>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/identificacao',
            )
          }
          className="mt-3 w-full text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          Voltar para
          identificação
        </button>
      </div>
    </div>
  );
}