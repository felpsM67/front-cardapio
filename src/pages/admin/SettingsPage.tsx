import { useState } from 'react';
import type { StoreConfig } from '../../models';
import { configService } from '../../services/configService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toggle } from '../../components/common/Toggle';

export function SettingsPage() {
  const [data, setData] = useState<StoreConfig>(configService.get());

  const set = (
    key: keyof StoreConfig,
    value: string | number | boolean,
  ) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  function toggleStore() {
    const next = { ...data, isOpen: !data.isOpen };
    setData(next);
    configService.save(next);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        configService.save(data);
        document.documentElement.style.setProperty(
          '--primary',
          data.primaryColor,
        );
        alert('Configurações salvas.');
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Configurações visuais e da loja
          </h1>
          <p className="mt-1 text-slate-500">
            Personalize a loja e controle o atendimento.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleStore}
          className={`flex min-w-48 items-center justify-between gap-4 rounded-2xl px-5 py-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 ${
            data.isOpen ? 'bg-emerald-600' : 'bg-slate-800'
          }`}
        >
          <span>
            <span
              className={`mr-2 inline-block h-3 w-3 rounded-full ${
                data.isOpen ? 'animate-pulse bg-white' : 'bg-red-400'
              }`}
            />
            {data.isOpen ? 'Loja aberta' : 'Loja fechada'}
          </span>
          <span className="text-xs opacity-80">
            Clique para {data.isOpen ? 'fechar' : 'abrir'}
          </span>
        </button>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2">
        <Input
          placeholder="Nome"
          value={data.storeName}
          onChange={(event) => set('storeName', event.target.value)}
        />

        <label className="rounded-xl border p-3">
          <span className="block text-sm font-semibold">Cor principal</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={data.primaryColor}
              onChange={(event) => set('primaryColor', event.target.value)}
              className="h-10 w-16"
            />
            <Input
              value={data.primaryColor}
              onChange={(event) => set('primaryColor', event.target.value)}
            />
          </div>
        </label>

        <Input
          placeholder="WhatsApp"
          value={data.whatsappNumber}
          onChange={(event) => set('whatsappNumber', event.target.value)}
        />
        <Input
          placeholder="Chave Pix"
          value={data.pixKey}
          onChange={(event) => set('pixKey', event.target.value)}
        />
        <Input
          placeholder="Beneficiário Pix"
          value={data.pixHolderName}
          onChange={(event) => set('pixHolderName', event.target.value)}
        />
        <Input
          type="number"
          placeholder="Taxa de entrega"
          value={data.deliveryFee}
          onChange={(event) => set('deliveryFee', Number(event.target.value))}
        />
        <Input
          type="number"
          placeholder="Pedido mínimo"
          value={data.minimumOrder}
          onChange={(event) => set('minimumOrder', Number(event.target.value))}
        />
        <Input
          placeholder="Tempo estimado"
          value={data.estimatedTime}
          onChange={(event) => set('estimatedTime', event.target.value)}
        />
        <Input
          placeholder="Horário"
          value={data.openingHours}
          onChange={(event) => set('openingHours', event.target.value)}
        />

        <div className="flex items-center">
          <Toggle
            checked={data.isOpen}
            labelOn="Recebendo pedidos"
            labelOff="Pedidos pausados"
            onChange={toggleStore}
          />
        </div>

        <Button className="sm:col-span-2">Salvar configurações</Button>
      </div>
    </form>
  );
}
