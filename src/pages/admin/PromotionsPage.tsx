import { useState } from 'react';
import { Link2, Link2Off, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Promotion } from '../../models';
import { promotionService } from '../../services/promotionService';
import { productService } from '../../services/productService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
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
  const [, refresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankPromotion());

  const promotions = promotionService.getAll();
  const products = productService.getAll();

  function openPromotion(promotion?: Promotion) {
    if (promotion) {
      setEditingId(promotion.id);
      setForm({
        title: promotion.title,
        description: promotion.description,
        imageUrl: promotion.imageUrl,
        productIds: promotion.productIds,
        promotionalPrices: promotion.promotionalPrices ?? {},
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

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(blankPromotion());
  }

  function savePromotion(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.imageUrl) {
      alert('Preencha título, descrição e imagem.');
      return;
    }

    if (form.clickable && !form.productIds.length) {
      alert('Selecione pelo menos um produto para a promoção clicável.');
      return;
    }

    const invalidPromotionalPrice = form.productIds.some((productId) => {
      const product = products.find((item) => item.id === productId);
      const promotionalPrice = form.promotionalPrices[productId];

      return (
        !product ||
        !promotionalPrice ||
        promotionalPrice <= 0 ||
        promotionalPrice >= product.price
      );
    });

    if (form.clickable && invalidPromotionalPrice) {
      alert(
        'Informe para cada produto um valor promocional maior que zero e menor que o valor original.',
      );
      return;
    }

    if (editingId) {
      promotionService.update(editingId, form);
    } else {
      promotionService.create(form);
    }

    closeModal();
    refresh((value) => value + 1);
  }

  function uploadImage(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageUrl: String(reader.result),
      }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Promoções</h1>
          <p className="mt-1 text-slate-500">
            Crie banners informativos ou promoções clicáveis com produtos.
          </p>
        </div>

        <Button onClick={() => openPromotion()}>
          <Plus size={18} />
          Nova promoção
        </Button>
      </div>

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
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black shadow-sm">
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
                  <h2 className="mt-2 font-black">{promotion.title}</h2>
                </div>

                <Toggle
                  checked={promotion.active}
                  onChange={() => {
                    promotionService.update(promotion.id, {
                      active: !promotion.active,
                    });
                    refresh((value) => value + 1);
                  }}
                />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {promotion.description}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                {promotion.clickable
                  ? `${promotion.productIds.length} produto(s) vinculado(s)`
                  : 'Banner sem ação ao clicar'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openPromotion(promotion)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 font-bold"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  onClick={() => {
                    if (!confirm('Excluir promoção?')) return;
                    promotionService.remove(promotion.id);
                    refresh((value) => value + 1);
                  }}
                  className="rounded-xl border p-2 text-red-600"
                  aria-label={`Excluir ${promotion.title}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeModal()
          }
        >
          <form
            onSubmit={savePromotion}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <h2 className="text-xl font-black">
                {editingId ? 'Editar' : 'Nova'} promoção
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
                placeholder="Título *"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />

              <Input
                placeholder="Selo (ex.: Oferta)"
                value={form.badge}
                onChange={(event) =>
                  setForm({ ...form, badge: event.target.value })
                }
              />

              <textarea
                className="min-h-24 rounded-xl border p-3 sm:col-span-2"
                placeholder="Descrição *"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />

              <label className="sm:col-span-2">
                <span className="mb-2 block font-bold">
                  Imagem da promoção *
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadImage(event.target.files?.[0])}
                  className="w-full rounded-xl border p-3"
                />

                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Pré-visualização da promoção"
                    className="mt-3 aspect-[16/6] w-full rounded-xl object-cover"
                  />
                )}
              </label>

              <Input
                type="number"
                min="1"
                placeholder="Ordem"
                value={form.order}
                onChange={(event) =>
                  setForm({ ...form, order: Number(event.target.value) })
                }
              />

              <label className="flex items-center justify-between rounded-xl border px-4 py-3">
                <span className="font-semibold">Promoção ativa</span>
                <Toggle
                  checked={form.active}
                  onChange={() => setForm({ ...form, active: !form.active })}
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border px-4 py-3 sm:col-span-2">
                <div>
                  <span className="block font-bold">Banner clicável</span>
                  <small className="text-slate-500">
                    Ao clicar, o cliente verá os produtos vinculados e poderá
                    adicionar ao carrinho.
                  </small>
                </div>

                <Toggle
                  checked={form.clickable}
                  onChange={() =>
                    setForm({
                      ...form,
                      clickable: !form.clickable,
                      productIds: form.clickable ? [] : form.productIds,
                      promotionalPrices: form.clickable
                        ? {}
                        : form.promotionalPrices,
                    })
                  }
                />
              </label>

              {form.clickable && (
                <section className="sm:col-span-2">
                  <b>Produtos vinculados</b>
                  <p className="mt-1 text-sm text-slate-500">
                    Esses produtos aparecerão no modal da promoção.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {products.map((product) => {
                      const selected = form.productIds.includes(product.id);

                      return (
                        <div
                          key={product.id}
                          className={`rounded-xl border p-3 ${
                            selected ? 'border-green-300 bg-green-50/40' : ''
                          }`}
                        >
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const checked = event.target.checked;

                                setForm({
                                  ...form,
                                  productIds: checked
                                    ? [...form.productIds, product.id]
                                    : form.productIds.filter(
                                        (id) => id !== product.id,
                                      ),
                                  promotionalPrices: checked
                                    ? {
                                        ...form.promotionalPrices,
                                        [product.id]: Number(
                                          Math.max(product.price - 1, 0.01).toFixed(2),
                                        ),
                                      }
                                    : Object.fromEntries(
                                        Object.entries(
                                          form.promotionalPrices,
                                        ).filter(([id]) => id !== product.id),
                                      ),
                                });
                              }}
                            />
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-bold">
                                {product.name}
                              </span>
                              <small className="text-slate-500">
                                Valor original: {formatCurrency(product.price)}
                              </small>
                            </div>
                          </label>

                          {selected && (
                            <label className="mt-3 block border-t pt-3">
                              <span className="mb-1 block text-sm font-bold">
                                Valor promocional
                              </span>
                              <Input
                                type="number"
                                min="0.01"
                                max={Math.max(product.price - 0.01, 0.01)}
                                step="0.01"
                                value={form.promotionalPrices[product.id] ?? ''}
                                onChange={(event) =>
                                  setForm({
                                    ...form,
                                    promotionalPrices: {
                                      ...form.promotionalPrices,
                                      [product.id]: Number(event.target.value),
                                    },
                                  })
                                }
                              />
                              <small className="mt-1 block text-slate-500">
                                No cardápio: <span className="line-through">
                                  {formatCurrency(product.price)}
                                </span>{' '}
                                <strong className="text-green-700">
                                  {formatCurrency(
                                    form.promotionalPrices[product.id] || 0,
                                  )}
                                </strong>
                              </small>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <Button className="sm:col-span-2">Salvar promoção</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
