import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Link2,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';

import type { StoreConfig } from '../../models';
import { configService } from '../../services/configService';
import { onlyDigits } from '../../utils/format';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { Toggle } from '../../components/common/Toggle';

type SettingsTab = 'store' | 'share';

const emptyStoreConfig: StoreConfig = {
  storeName: '',
  description: '',
  whatsappNumber: '',
  pixKey: '',
  pixHolderName: '',
  deliveryFee: 0,
  minimumOrder: null,
  menuSlug: '',
  estimatedTime: '',
  openingHours: '',
  isOpen: false,
  primaryColor: '#ea580c',
  coverUrl: '',
};

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
  const [data, setData] =
    useState<StoreConfig>(emptyStoreConfig);

  const [activeTab, setActiveTab] =
    useState<SettingsTab>('store');

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        const config = await configService.get();
        setData(config);
      } catch (loadError) {
        console.error(
          'Erro ao carregar configurações:',
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as configurações.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const url = new URL('/', window.location.origin);

    if (data.menuSlug) {
      url.searchParams.set('loja', data.menuSlug);
    }

    return url.toString();
  }, [data.menuSlug]);

  function set<K extends keyof StoreConfig>(
    key: K,
    value: StoreConfig[K],
  ): void {
    setData((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage(null);
    setError(null);
  }

  function changePrimaryColor(value: string): void {
    set('primaryColor', value);
    configService.applyPrimaryColor(value);
  }

  async function saveSettings(): Promise<void> {
    if (!data.storeName.trim()) {
      setError('Informe o nome da loja.');
      return;
    }

    if (!data.menuSlug.trim()) {
      setError('Informe o identificador do cardápio.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const saved = await configService.save(data);

      setData(saved);
      setMessage('Configurações salvas com sucesso.');
    } catch (saveError) {
      console.error(
        'Erro ao salvar configurações:',
        saveError,
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar as configurações.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStore(): Promise<void> {
    const previous = data;
    const next: StoreConfig = {
      ...data,
      isOpen: !data.isOpen,
    };

    setData(next);

    try {
      setTogglingStore(true);
      setError(null);
      setMessage(null);

      const saved = await configService.save(next);

      setData(saved);
      setMessage(
        saved.isOpen
          ? 'A loja está recebendo pedidos.'
          : 'Os pedidos foram pausados.',
      );
    } catch (toggleError) {
      setData(previous);

      console.error(
        'Erro ao alterar situação da loja:',
        toggleError,
      );

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Não foi possível alterar a situação da loja.',
      );
    } finally {
      setTogglingStore(false);
    }
  }

  function generateSlug(): void {
    set('menuSlug', slugify(data.storeName));
    setCopied(false);
  }

  async function copyShareUrl(): Promise<void> {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        'Não foi possível copiar o link automaticamente.',
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveSettings();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Configurações
          </h1>

          <p className="mt-1 text-slate-500">
            Personalize a loja e defina como o cardápio será
            compartilhado.
          </p>
        </div>

        <button
          type="button"
          disabled={togglingStore || saving}
          onClick={() => void toggleStore()}
          className={`flex min-w-48 items-center justify-between gap-4 rounded-2xl px-5 py-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
            data.isOpen
              ? 'bg-emerald-600'
              : 'bg-slate-800'
          }`}
        >
          <span>
            <span
              className={`mr-2 inline-block h-3 w-3 rounded-full ${
                data.isOpen
                  ? 'animate-pulse bg-white'
                  : 'bg-red-400'
              }`}
            />

            {data.isOpen
              ? 'Loja aberta'
              : 'Loja fechada'}
          </span>

          <span className="text-xs opacity-80">
            {togglingStore
              ? 'Salvando...'
              : `Clique para ${
                  data.isOpen ? 'fechar' : 'abrir'
                }`}
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

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
              ? {
                  backgroundColor: 'var(--primary)',
                }
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
              ? {
                  backgroundColor: 'var(--primary)',
                }
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
            placeholder="Nome da loja"
            value={data.storeName}
            onChange={(event) =>
              set('storeName', event.target.value)
            }
          />

          <label className="rounded-xl border p-3">
            <span className="block text-sm font-semibold">
              Cor principal
            </span>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(event) =>
                  changePrimaryColor(event.target.value)
                }
                className="h-10 w-16"
              />

              <Input
                value={data.primaryColor}
                onChange={(event) =>
                  changePrimaryColor(event.target.value)
                }
              />
            </div>
          </label>

          <textarea
            placeholder="Descrição da loja"
            value={data.description}
            onChange={(event) =>
              set('description', event.target.value)
            }
            className="min-h-28 rounded-xl border p-3 sm:col-span-2"
          />

          <ImageUploadField
            value={data.coverUrl}
            onFile={(file) => {
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => set('coverUrl', String(reader.result));
              reader.readAsDataURL(file);
            }}
            onRemove={() => set('coverUrl', '')}
            title="Imagem de capa da loja"
            description="Recomendado: imagem horizontal em boa resolução"
            previewClassName="aspect-[16/5]"
          />

          <Input
            type="tel"
            inputMode="numeric"
              maxLength={15}
            placeholder="(xx)xxxxx-xxxx"
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
            onChange={(event) =>
              set('pixKey', event.target.value)
            }
          />

          <Input
            placeholder="Beneficiário Pix"
            value={data.pixHolderName}
            onChange={(event) =>
              set('pixHolderName', event.target.value)
            }
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Taxa de entrega"
            value={data.deliveryFee}
            onChange={(event) =>
              set(
                'deliveryFee',
                Number(event.target.value),
              )
            }
          />

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Pedido mínimo
            </span>

            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional"
              value={data.minimumOrder ?? ''}
              onChange={(event) =>
                set(
                  'minimumOrder',
                  event.target.value === ''
                    ? null
                    : Number(event.target.value),
                )
              }
            />
          </label>

          <Input
            placeholder="Tempo estimado, ex.: 35–50 min"
            value={data.estimatedTime}
            onChange={(event) =>
              set('estimatedTime', event.target.value)
            }
          />

          <Input
            placeholder="Horário, ex.: 18:00 às 23:30"
            value={data.openingHours}
            onChange={(event) =>
              set('openingHours', event.target.value)
            }
          />

          <div className="flex items-center">
            <Toggle
              checked={data.isOpen}
              labelOn="Recebendo pedidos"
              labelOff="Pedidos pausados"
              onChange={() => void toggleStore()}
            />
          </div>

          <Button
            className="sm:col-span-2"
            disabled={saving || togglingStore}
          >
            {saving
              ? 'Salvando...'
              : 'Salvar configurações'}
          </Button>
        </div>
      )}

      {activeTab === 'share' && (
        <div className="mt-4 rounded-2xl bg-white p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black">
              Link de compartilhamento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Escolha um identificador simples para gerar o
              endereço público do seu cardápio.
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
                    set(
                      'menuSlug',
                      slugify(event.target.value),
                    );

                    setCopied(false);
                  }}
                />

                <Button
                  type="button"
                  onClick={generateSlug}
                  className="whitespace-nowrap bg-slate-700"
                  style={{
                    backgroundColor: '#334155',
                  }}
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
                  {copied
                    ? <Check size={17} />
                    : <Copy size={17} />}

                  {copied
                    ? 'Link copiado'
                    : 'Copiar link'}
                </Button>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition hover:bg-white ${
                    data.menuSlug
                      ? ''
                      : 'pointer-events-none opacity-50'
                  }`}
                >
                  <ExternalLink size={17} />
                  Abrir cardápio
                </a>
              </div>
            </div>

            <Button
              className="mt-6"
              disabled={!data.menuSlug || saving}
            >
              {saving
                ? 'Salvando...'
                : 'Salvar link do cardápio'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}