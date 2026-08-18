import { useState } from 'react';

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { UserRound } from 'lucide-react';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

import { CheckoutSteps } from '../../components/common/CheckoutSteps';

import {
  formatPhone,
  onlyDigits,
} from '../../utils/format';

import { authService } from '../../services/authService';

import { useAuth } from '../../contexts/AuthContext';

import { STORAGE_KEYS } from '../../constants/storage';

import { storageService } from '../../services/storageService';

import { useCart } from '../../contexts/CartContext';

type IdentificationLocationState = {
  from?: string;
};

export function IdentificationPage(): React.JSX.Element {
  const cart = useCart();

  const {
    customer,
    setCustomer,
  } = useAuth();

  const [name, setName] =
    useState(
      customer?.name ?? '',
    );

  const [phone, setPhone] =
    useState(
      customer?.phone
        ? formatPhone(
            customer.phone,
          )
        : '',
    );

  const navigate =
    useNavigate();

  const location =
    useLocation();

  if (!cart.items.length) {
    return (
      <Navigate
        to="/carrinho"
        replace
      />
    );
  }

  function submit(
    event: React.FormEvent,
  ): void {
    event.preventDefault();

    if (
      name.trim().length < 3 ||
      onlyDigits(phone).length < 10
    ) {
      alert(
        'Preencha nome e telefone corretamente.',
      );

      return;
    }

    const currentPhone =
      onlyDigits(
        customer?.phone ?? '',
      );

    const nextPhone =
      onlyDigits(phone);

    if (
      currentPhone &&
      currentPhone !== nextPhone
    ) {
      storageService.remove(
        STORAGE_KEYS.CHECKOUT_ADDRESS,
      );
    }

    setCustomer(
      authService.saveCustomer(
        name.trim(),
        nextPhone,
      ),
    );

    const state =
      location.state as
        | IdentificationLocationState
        | null;

    navigate(
      state?.from ??
        '/checkout/endereco',
      {
        replace: true,
      },
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <CheckoutSteps
        current={2}
      />

      <form
        onSubmit={submit}
        className="surface-card p-6 sm:p-8"
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            color:
              'var(--primary)',

            backgroundColor:
              'color-mix(in srgb, var(--primary) 10%, white)',
          }}
        >
          <UserRound
            size={23}
          />
        </span>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Etapa 2
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Seus dados
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Precisamos do seu nome e
          WhatsApp para identificar o
          pedido e enviar atualizações
          sobre o atendimento.
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Nome
            </label>

            <Input
              autoFocus
              placeholder="Seu nome completo"
              value={name}
              onChange={(
                event,
              ) =>
                setName(
                  event.target.value,
                )
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              WhatsApp
            </label>

            <Input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              placeholder="(67) 99999-9999"
              value={phone}
              onChange={(
                event,
              ) =>
                setPhone(
                  formatPhone(
                    event.target
                      .value,
                  ),
                )
              }
            />
          </div>

          <Button className="w-full">
            Continuar para
            recebimento
          </Button>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/carrinho',
              )
            }
            className="w-full text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            Voltar ao carrinho
          </button>
        </div>
      </form>
    </div>
  );
}