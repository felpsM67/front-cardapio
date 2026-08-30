import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { formatPhone, onlyDigits } from '../../utils/format';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { STORAGE_KEYS } from '../../constants/storage';
import { storageService } from '../../services/storageService';

type IdentificationLocationState = {
  from?: string;
};

export function IdentificationPage() {
  const { customer, setCustomer } = useAuth();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(
    customer?.phone ? formatPhone(customer.phone) : '',
  );
  const navigate = useNavigate();
  const location = useLocation();

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (name.trim().length < 3 || onlyDigits(phone).length < 10) {
      alert('Preencha nome e telefone corretamente.');
      return;
    }

    const currentPhone = onlyDigits(customer?.phone ?? '');
    const nextPhone = onlyDigits(phone);

    if (currentPhone && currentPhone !== nextPhone) {
      storageService.remove(STORAGE_KEYS.CHECKOUT_ADDRESS);
    }

    setCustomer(authService.saveCustomer(name.trim(), phone));

    const state = location.state as IdentificationLocationState | null;
    navigate(state?.from ?? '/carrinho', { replace: true });
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
        Identificação do cliente
      </p>
      <h1 className="mt-2 text-3xl font-black">Cadastro do cliente</h1>
      <p className="mt-2 text-slate-500">
        Seu carrinho já está confirmado. Informe seus dados para continuar e
        recuperar o último endereço usado por este telefone.
      </p>

      <div className="mt-8 space-y-4">
        <Input
          placeholder="Nome completo"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={14}
          placeholder="67 9 9999-9999"
          value={phone}
          onChange={(event) =>
            setPhone(formatPhone(event.target.value))
          }
        />
        <Button className="w-full">Continuar para o carrinho</Button>
      </div>
    </form>
  );
}
