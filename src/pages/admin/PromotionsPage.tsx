import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  Link2,
  Link2Off,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import type { Product, Promotion } from '../../models';
import { promotionService } from '../../services/promotionService';
import { productService } from '../../services/productService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { Toggle } from '../../components/common/Toggle';
import { formatCurrency } from '../../utils/format';

const blankPromotion = (): Omit<Promotion, 'id'> => ({
  title: '',
  description: '',
  imageUrl: '',
  productIds: [],
  promotionalPrices: {},
  active: true,
  clickable: false,
  badge: 'Oferta',
  order: 1,
  startsAt: '',
  endsAt: '',
});

export function PromotionsPage() {
  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState(blankPromotion());

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const [loadedPromotions, loadedProducts] =
        await Promise.all([
          promotionService.getAll(),
          Promise.resolve(productService.getAll()),
        ]);

      setPromotions(loadedPromotions);
      setProducts(loadedProducts);
    } catch (loadError) {
      console.error(
        'Erro ao carregar promoções:',
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as promoções.',
      );
    } finally {
      setLoading(false);
    }
  }

  function openPromotion(
    promotion?: Promotion,
  ): void {
    setError(null);

    if (promotion) {
      setEditingId(promotion.id);

      setForm({
        title: promotion.title,
        description: promotion.description,
        imageUrl: promotion.imageUrl,
        productIds: [...promotion.productIds],
        promotionalPrices: {
          ...promotion.promotionalPrices,
        },
        active: promotion.active,
        clickable: promotion.clickable,
        badge: promotion.badge,
        order: promotion.order,
        startsAt: promotion.startsAt ?? '',
        endsAt: promotion.endsAt ?? '',
      });
    } else {
      setEditingId(null);
      setForm(blankPromotion());
    }

    setModalOpen(true);
  }

  function closeModal(): void {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(blankPromotion());
  }

  async function savePromotion(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.imageUrl.trim()
    ) {
      setError(
        'Preencha título, descrição e imagem.',
      );
      return;
    }

    if (
      form.clickable &&
      !form.productIds.length
    ) {
      setError(
        'Selecione pelo menos um produto.',
      );
      return;
    }

    const invalidPrice =
      form.productIds.some((productId) => {
        const product = products.find(
          (item) => item.id === productId,
        );

        const promotionalPrice =
          form.promotionalPrices[productId];

        return (
          !product ||
          !promotionalPrice ||
          promotionalPrice <= 0 ||
          promotionalPrice >= product.price
        );
      });

    if (form.clickable && invalidPrice) {
      setError(
        'O preço promocional precisa ser maior que zero e menor que o preço original.',
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        await promotionService.update(
          editingId,
          form,
        );
      } else {
        await promotionService.create(form);
      }

      closeModal();
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a promoção.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(
    promotion: Promotion,
  ): Promise<void> {
    try {
      await promotionService.update(
        promotion.id,
        {
          active: !promotion.active,
        },
      );

      await loadData();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Não foi possível alterar a promoção.',
      );
    }
  }

  async function removePromotion(
    promotion: Promotion,
  ): Promise<void> {
    if (
      !confirm(
        `Excluir a promoção “${promotion.title}”?`,
      )
    ) {
      return;
    }

    try {
      await promotionService.remove(
        promotion.id,
      );

      await loadData();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Não foi possível excluir a promoção.',
      );
    }
  }

  function uploadImage(file?: File): void {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageUrl: String(reader.result),
      }));
    };

    reader.onerror = () => {
      setError(
        'Não foi possível carregar a imagem.',
      );
    };

    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <p className="py-16 text-center text-slate-500">
        Carregando promoções...
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">
            Promoções
          </h1>

          <p className="mt-1 text-slate-500">
            Crie banners e ofertas clicáveis.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => openPromotion()}
        >
          <Plus size={18} />
          Nova promoção
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <article
            key={promotion.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm"
          >
            <div className="relative">
              <img
                src={promotion.imageUrl}
                alt={promotion.title}
                className="aspect-[16/9] w-full object-cover"
              />

              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black">
                {promotion.clickable ? (
                  <span className="flex items-center gap-1 text-green-700">
                    <Link2 size={13} />
                    Clicável
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Link2Off size={13} />
                    Somente banner
                  </span>
                )}
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    {promotion.badge}
                  </span>

                  <h2 className="mt-2 font-black">
                    {promotion.title}
                  </h2>
                </div>

                <Toggle
                  checked={promotion.active}
                  onChange={() =>
                    void togglePromotion(promotion)
                  }
                />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {promotion.description}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                {promotion.clickable
                  ? `${promotion.productIds.length} produto(s)`
                  : 'Banner sem clique'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPromotion(promotion)
                  }
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 font-bold"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void removePromotion(promotion)
                  }
                  className="rounded-xl border p-2 text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={(event) =>
              void savePromotion(event)
            }
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white"
          >
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <h2 className="text-xl font-black">
                {editingId
                  ? 'Editar promoção'
                  : 'Nova promoção'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-100 p-2"
              >
                <X />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Input
                placeholder="Título"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />

              <Input
                placeholder="Selo"
                value={form.badge}
                onChange={(event) =>
                  setForm({
                    ...form,
                    badge: event.target.value,
                  })
                }
              />

              <textarea
                className="min-h-24 rounded-xl border p-3 sm:col-span-2"
                placeholder="Descrição"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />

              <Input
                className="sm:col-span-2"
                placeholder="URL da imagem"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    imageUrl: event.target.value,
                  })
                }
              />

              <ImageUploadField
                value={form.imageUrl}
                onFile={uploadImage}
                onRemove={() => setForm({ ...form, imageUrl: '' })}
                title="Banner da promoção"
                description="Use uma imagem horizontal para destacar a oferta"
                previewClassName="aspect-[16/6]"
              />

              <Input
                type="number"
                min="1"
                value={form.order}
                onChange={(event) =>
                  setForm({
                    ...form,
                    order: Number(
                      event.target.value,
                    ),
                  })
                }
              />

              <label className="flex items-center justify-between rounded-xl border p-3">
                <span>Ativa</span>

                <Toggle
                  checked={form.active}
                  onChange={() =>
                    setForm({
                      ...form,
                      active: !form.active,
                    })
                  }
                />
              </label>

              <Input
                type="datetime-local"
                value={form.startsAt ?? ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    startsAt: event.target.value,
                  })
                }
              />

              <Input
                type="datetime-local"
                value={form.endsAt ?? ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    endsAt: event.target.value,
                  })
                }
              />

              <label className="flex items-center justify-between rounded-xl border p-3 sm:col-span-2">
                <span>Banner clicável</span>

                <Toggle
                  checked={form.clickable}
                  onChange={() =>
                    setForm({
                      ...form,
                      clickable: !form.clickable,
                    })
                  }
                />
              </label>

              {form.clickable && (
                <div className="space-y-3 sm:col-span-2">
                  {products.map((product) => {
                    const selected =
                      form.productIds.includes(
                        product.id,
                      );

                    return (
                      <div
                        key={product.id}
                        className="rounded-xl border p-3"
                      >
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const checked =
                                event.target.checked;

                              setForm({
                                ...form,
                                productIds: checked
                                  ? [
                                      ...form.productIds,
                                      product.id,
                                    ]
                                  : form.productIds.filter(
                                      (id) =>
                                        id !== product.id,
                                    ),
                                promotionalPrices:
                                  checked
                                    ? {
                                        ...form.promotionalPrices,
                                        [product.id]:
                                          Math.max(
                                            product.price - 1,
                                            0.01,
                                          ),
                                      }
                                    : Object.fromEntries(
                                        Object.entries(
                                          form.promotionalPrices,
                                        ).filter(
                                          ([id]) =>
                                            id !== product.id,
                                        ),
                                      ),
                              });
                            }}
                          />

                          <span className="font-bold">
                            {product.name}
                          </span>

                          <span className="text-sm text-slate-500">
                            {formatCurrency(
                              product.price,
                            )}
                          </span>
                        </label>

                        {selected && (
                          <Input
                            className="mt-3"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={
                              form.promotionalPrices[
                                product.id
                              ] ?? ''
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                promotionalPrices: {
                                  ...form.promotionalPrices,
                                  [product.id]: Number(
                                    event.target.value,
                                  ),
                                },
                              })
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                className="sm:col-span-2"
                disabled={saving}
              >
                {saving
                  ? 'Salvando...'
                  : 'Salvar promoção'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}