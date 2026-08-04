import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Settings2 } from 'lucide-react';
import type { StoreConfig } from '../../models';
import { configService } from '../../services/configService';
import { onlyDigits } from '../../utils/format';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toggle } from '../../components/common/Toggle';

type SettingsTab = 'store' | 'share';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function SettingsPage() {
  const [data, setData] = useState<StoreConfig>(configService.get());
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const url = new URL('/', window.location.origin);
    if (data.menuSlug) url.searchParams.set('loja', data.menuSlug);
    return url.toString();
  }, [data.menuSlug]);

  const set = (
    key: keyof StoreConfig,
    value: string | number | boolean | null,
  ) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  function saveSettings() {
    configService.save(data);
    document.documentElement.style.setProperty(
      '--primary',
      data.primaryColor,
    );
  }

  function toggleStore() {
    const next = { ...data, isOpen: !data.isOpen };
    setData(next);
    configService.save(next);
  }

  function generateSlug() {
    set('menuSlug', slugify(data.storeName));
    setCopied(false);
  }

  async function copyShareUrl() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Não foi possível copiar o link automaticamente.');
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saveSettings();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Configurações</h1>
          <p className="mt-1 text-slate-500">
            Personalize a loja e defina como o cardápio será compartilhado.
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

      <div className="mt-6 flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'store'
              ? 'text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          style={
            activeTab === 'store'
              ? { backgroundColor: 'var(--primary)' }
              : undefined
          }
        >
          <Settings2 size={18} />
          Loja
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('share')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'share'
              ? 'text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          style={
            activeTab === 'share'
              ? { backgroundColor: 'var(--primary)' }
              : undefined
          }
        >
          <Link2 size={18} />
          Link do cardápio
        </button>
      </div>

      {activeTab === 'store' && (
        <div className="mt-4 grid gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2">
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
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={15}
            placeholder="5567999999999"
            value={data.whatsappNumber}
            onChange={(event) =>
              set(
                'whatsappNumber',
                onlyDigits(event.target.value).slice(0, 15),
              )
            }
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
            onChange={(event) =>
              set('deliveryFee', Number(event.target.value))
            }
          />

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Pedido mínimo (opcional)
            </span>
            <Input
              type="number"
              min="0"
              placeholder="Deixe em branco para não exigir mínimo"
              value={data.minimumOrder ?? ''}
              onChange={(event) =>
                set(
                  'minimumOrder',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
            <span className="mt-1 block text-xs text-slate-500">
              Sem valor informado, o cliente poderá finalizar pedidos de qualquer
              valor.
            </span>
          </label>

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
      )}

      {activeTab === 'share' && (
        <div className="mt-4 rounded-2xl bg-white p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black">Link de compartilhamento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Escolha um identificador simples para gerar o endereço público do
              seu cardápio.
            </p>

            <label className="mt-6 block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Identificador do cardápio
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="ex.: sabor-express"
                  value={data.menuSlug}
                  onChange={(event) => {
                    set('menuSlug', slugify(event.target.value));
                    setCopied(false);
                  }}
                />
                <Button
                  type="button"
                  onClick={generateSlug}
                  className="whitespace-nowrap bg-slate-700"
                  style={{ backgroundColor: '#334155' }}
                >
                  Gerar pelo nome
                </Button>
              </div>
            </label>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Link gerado
              </span>
              <p className="mt-2 break-all font-semibold text-slate-800">
                {shareUrl}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void copyShareUrl()}
                  disabled={!data.menuSlug}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? 'Link copiado' : 'Copiar link'}
                </Button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition hover:bg-white ${
                    data.menuSlug ? '' : 'pointer-events-none opacity-50'
                  }`}
                >
                  <ExternalLink size={17} />
                  Abrir cardápio
                </a>
              </div>
            </div>

            <Button className="mt-6" disabled={!data.menuSlug}>
              Salvar link do cardápio
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
