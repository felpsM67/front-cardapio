import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import {
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import type {
  AddonCatalogItem,
  AddonGroup,
  Product,
  ProductOptionItem,
} from '../../models';

import { addonCatalogService } from '../../services/addonCatalogService';
import { addonGroupService } from '../../services/addonGroupService';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toggle } from '../../components/common/Toggle';
import { formatCurrency } from '../../utils/format';

type ProductForm = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt'
>;

const emptyProduct = (): ProductForm => ({
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  categoryId: '',
  available: true,
  featured: false,
  order: 1,
});

export function ProductsPage() {
  const [, refresh] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyProduct());

  const [addonItems, setAddonItems] =
    useState<ProductOptionItem[]>([]);

  const [catalogItems, setCatalogItems] =
    useState<AddonCatalogItem[]>([]);

  const [addonGroups, setAddonGroups] =
    useState<AddonGroup[]>([]);

  const [addonSearch, setAddonSearch] =
    useState('');

  const [showAddonForm, setShowAddonForm] =
    useState(false);

  const [editingAddonId, setEditingAddonId] =
    useState<string | null>(null);

  const [addonForm, setAddonForm] = useState({
    name: '',
    price: 0,
  });

  const [maxSelections, setMaxSelections] =
    useState(3);

  const [loadingAddons, setLoadingAddons] =
    useState(true);

  const [savingProduct, setSavingProduct] =
    useState(false);

  const products = productService.getAll();
  const categories = categoryService.getAll();

  useEffect(() => {
    void loadAddonData();
  }, []);

  async function loadAddonData(): Promise<void> {
    try {
      setLoadingAddons(true);

      const [catalog, groups] = await Promise.all([
        addonCatalogService.getAll(),
        addonGroupService.getAll(),
      ]);

      setCatalogItems(catalog);
      setAddonGroups(groups);
    } catch (error) {
      console.error(
        'Erro ao carregar adicionais:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar adicionais.',
      );
    } finally {
      setLoadingAddons(false);
    }
  }

  const filteredCatalog = useMemo(() => {
    const search = addonSearch
      .trim()
      .toLocaleLowerCase('pt-BR');

    if (!search) {
      return catalogItems;
    }

    return catalogItems.filter((item) =>
      item.name
        .toLocaleLowerCase('pt-BR')
        .includes(search),
    );
  }, [addonSearch, catalogItems]);

  function getProductAddonCount(
    productId: string,
  ): number {
    return addonGroups
      .filter((group) =>
        group.applicableProductIds.includes(productId),
      )
      .reduce(
        (total, group) =>
          total + group.items.length,
        0,
      );
  }

  function openNewProduct(): void {
    setEditingId(null);

    setForm({
      ...emptyProduct(),
      categoryId: categories[0]?.id ?? '',
      order: products.length + 1,
    });

    setAddonItems([]);
    setMaxSelections(3);
    setAddonSearch('');
    closeAddonForm();
    setModalOpen(true);
  }

  async function openProduct(
    product: Product,
  ): Promise<void> {
    try {
      const groups =
        await addonGroupService.getForProduct(
          product.id,
        );

      const group = groups[0];

      setEditingId(product.id);

      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        available: product.available,
        featured: product.featured,
        order: product.order,
      });

      setAddonItems(
        group?.items.map((item) => ({
          ...item,
        })) ?? [],
      );

      setMaxSelections(
        group?.maxSelections ?? 3,
      );

      setAddonSearch('');
      closeAddonForm();
      setModalOpen(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar adicionais do produto.',
      );
    }
  }

  function closeModal(): void {
    if (savingProduct) {
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyProduct());
    setAddonItems([]);
    setAddonSearch('');
    closeAddonForm();
  }

  function closeAddonForm(): void {
    setShowAddonForm(false);
    setEditingAddonId(null);
    setAddonForm({
      name: '',
      price: 0,
    });
  }

  function uploadImage(file?: File): void {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageUrl: String(reader.result),
      }));
    };

    reader.onerror = () => {
      alert('Não foi possível carregar a imagem.');
    };

    reader.readAsDataURL(file);
  }

  function isAddonSelected(
    id: string,
  ): boolean {
    return addonItems.some(
      (item) => item.id === id,
    );
  }

  function toggleAddon(
    item: AddonCatalogItem,
  ): void {
    if (!item.available) {
      return;
    }

    if (isAddonSelected(item.id)) {
      setAddonItems((current) =>
        current.filter(
          (selected) =>
            selected.id !== item.id,
        ),
      );

      return;
    }

    setAddonItems((current) => [
      ...current,
      {
        id: item.id,
        name: item.name,
        price: item.price,
        available: item.available,
      },
    ]);
  }

  function startEditingAddon(
    item: AddonCatalogItem,
  ): void {
    setEditingAddonId(item.id);

    setAddonForm({
      name: item.name,
      price: item.price,
    });

    setShowAddonForm(true);
  }

  async function saveCatalogAddon(): Promise<void> {
    const name = addonForm.name.trim();

    if (!name) {
      alert('Informe o nome do adicional.');
      return;
    }

    if (addonForm.price < 0) {
      alert(
        'O valor do adicional não pode ser negativo.',
      );
      return;
    }

    try {
      if (editingAddonId) {
        const updated =
          await addonCatalogService.update(
            editingAddonId,
            {
              name,
              price: addonForm.price,
            },
          );

        setCatalogItems((current) =>
          current.map((item) =>
            item.id === editingAddonId
              ? updated
              : item,
          ),
        );

        setAddonItems((current) =>
          current.map((item) =>
            item.id === editingAddonId
              ? {
                  ...item,
                  name: updated.name,
                  price: updated.price,
                  available:
                    updated.available,
                }
              : item,
          ),
        );
      } else {
        const created =
          await addonCatalogService.create({
            name,
            price: addonForm.price,
            available: true,
          });

        setCatalogItems((current) => [
          ...current,
          created,
        ]);

        setAddonItems((current) => [
          ...current,
          {
            id: created.id,
            name: created.name,
            price: created.price,
            available: created.available,
          },
        ]);
      }

      closeAddonForm();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar adicional.',
      );
    }
  }

  async function toggleCatalogAvailability(
    item: AddonCatalogItem,
  ): Promise<void> {
    try {
      const updated =
        await addonCatalogService.update(
          item.id,
          {
            available: !item.available,
          },
        );

      setCatalogItems((current) =>
        current.map((catalogItem) =>
          catalogItem.id === item.id
            ? updated
            : catalogItem,
        ),
      );

      if (!updated.available) {
        setAddonItems((current) =>
          current.filter(
            (selected) =>
              selected.id !== item.id,
          ),
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao alterar disponibilidade do adicional.',
      );
    }
  }

  async function removeCatalogAddon(
    item: AddonCatalogItem,
  ): Promise<void> {
    if (
      !confirm(
        `Excluir o adicional “${item.name}” da lista?`,
      )
    ) {
      return;
    }

    try {
      await addonCatalogService.remove(item.id);

      setCatalogItems((current) =>
        current.filter(
          (catalogItem) =>
            catalogItem.id !== item.id,
        ),
      );

      setAddonItems((current) =>
        current.filter(
          (selected) =>
            selected.id !== item.id,
        ),
      );

      await loadAddonData();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir adicional.',
      );
    }
  }

  async function saveAddons(
    productId: string,
    productName: string,
  ): Promise<void> {
    const existingGroups =
      await addonGroupService.getForProduct(
        productId,
      );

    const [existingGroup, ...extraGroups] =
      existingGroups;

    for (const group of extraGroups) {
      await addonGroupService.remove(group.id);
    }

    if (!addonItems.length) {
      if (existingGroup) {
        await addonGroupService.remove(
          existingGroup.id,
        );
      }

      return;
    }

    const groupData: Omit<
      AddonGroup,
      'id'
    > = {
      name: `Adicionais de ${productName}`,
      required: false,
      maxSelections,
      active: true,
      applicableProductIds: [productId],
      items: addonItems,
    };

    if (existingGroup) {
      await addonGroupService.update(
        existingGroup.id,
        groupData,
      );

      return;
    }

    await addonGroupService.create(groupData);
  }

  async function saveProduct(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!form.name.trim()) {
      alert('Informe o nome do produto.');
      return;
    }

    if (!form.categoryId) {
      alert(
        'Cadastre e selecione uma categoria.',
      );
      return;
    }

    try {
      setSavingProduct(true);

      const savedProduct = editingId
        ? await productService.update(
            editingId,
            form,
          )
        : await productService.create(form);

      await saveAddons(
        savedProduct.id,
        savedProduct.name,
      );

      await loadAddonData();

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyProduct());
      setAddonItems([]);
      closeAddonForm();

      refresh((value) => value + 1);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar produto.',
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function toggleProductAvailability(
    product: Product,
  ): Promise<void> {
    try {
      await productService.toggleAvailability(
        product.id,
      );

      refresh((value) => value + 1);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao alterar disponibilidade.',
      );
    }
  }

  async function removeProduct(
    product: Product,
  ): Promise<void> {
    if (
      !confirm(
        `Excluir o produto “${product.name}”?`,
      )
    ) {
      return;
    }

    try {
      const groups =
        await addonGroupService.getForProduct(
          product.id,
        );

      for (const group of groups) {
        await addonGroupService.remove(group.id);
      }

      await productService.remove(product.id);
      await loadAddonData();

      refresh((value) => value + 1);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir produto.',
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">
            Produtos e adicionais
          </h1>

          <p className="mt-1 text-slate-500">
            Cadastre produtos e escolha adicionais
            de uma lista reutilizável.
          </p>
        </div>

        <Button
          type="button"
          onClick={openNewProduct}
        >
          <Plus size={18} />
          Adicionar item
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const addonCount =
            getProductAddonCount(product.id);

          return (
            <article
              key={product.id}
              onClick={() =>
                void openProduct(product)
              }
              className="cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div className="aspect-[16/9] w-full bg-slate-200" />
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-black">
                      {product.name}
                    </h2>

                    <p
                      className="mt-1 font-bold"
                      style={{
                        color: 'var(--primary)',
                      }}
                    >
                      {formatCurrency(product.price)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {loadingAddons
                        ? 'Carregando adicionais...'
                        : `${addonCount} adicional(is) selecionado(s)`}
                    </p>
                  </div>

                  <div
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <Toggle
                      checked={product.available}
                      labelOn="Ativo"
                      labelOff="Inativo"
                      onChange={() =>
                        void toggleProductAvailability(
                          product,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void openProduct(product);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm font-bold"
                    style={{
                      color: 'var(--primary)',
                      borderColor:
                        'var(--primary)',
                    }}
                  >
                    <Pencil size={16} />
                    Editar e configurar
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      void removeProduct(product);
                    }}
                    aria-label={`Excluir ${product.name}`}
                    className="rounded-xl border p-2 text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!products.length && (
        <div className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
          Nenhum produto cadastrado.
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <form
            onSubmit={(event) =>
              void saveProduct(event)
            }
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-4xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-black">
                  {editingId
                    ? 'Editar produto'
                    : 'Adicionar produto'}
                </h2>

                <p className="text-sm text-slate-500">
                  Dados do item e adicionais no mesmo
                  formulário.
                </p>
              </div>

              <button
                type="button"
                disabled={savingProduct}
                onClick={closeModal}
                className="rounded-full bg-slate-100 p-2 disabled:opacity-50"
              >
                <X />
              </button>
            </div>

            <div className="space-y-7 p-5">
              <section>
                <h3 className="mb-3 text-lg font-black">
                  Informações do item
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Nome do produto"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="Preço"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price: Number(
                          event.target.value,
                        ),
                      })
                    }
                  />

                  <select
                    className="rounded-xl border px-4 py-3"
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        categoryId:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Selecione uma categoria
                    </option>

                    {categories.map((category) => (
                      <option
                        value={category.id}
                        key={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <Input
                    placeholder="Ordem no cardápio"
                    type="number"
                    min="1"
                    value={form.order}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        order: Math.max(
                          1,
                          Number(
                            event.target.value,
                          ),
                        ),
                      })
                    }
                  />

                  <textarea
                    className="min-h-28 rounded-xl border p-3 sm:col-span-2"
                    placeholder="Descrição do produto"
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                  />
                  <label className="rounded-xl border p-3 sm:col-span-2">
                    <span className="block text-sm font-semibold">
                      Selecione uma imagem
                    </span>

                    <input
                      className="mt-2 w-full text-sm"
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        uploadImage(
                          event.target.files?.[0],
                        )
                      }
                    />
                  </label>

                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Pré-visualização do produto"
                      className="aspect-video w-full rounded-xl object-cover sm:col-span-2"
                    />
                  )}

                  <label className="flex items-center justify-between rounded-xl border p-3">
                    <span className="font-semibold">
                      Produto no cardápio
                    </span>

                    <Toggle
                      checked={form.available}
                      labelOn="Ativo"
                      labelOff="Inativo"
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          available:
                            !current.available,
                        }))
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border p-3">
                    <span className="font-semibold">
                      Produto em destaque
                    </span>

                    <Toggle
                      checked={form.featured}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          featured:
                            !current.featured,
                        }))
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="border-t pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">
                      Adicionais do item
                    </h3>

                    <p className="text-sm text-slate-500">
                      Selecione na lista. Você só
                      cadastra cada adicional uma vez.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeAddonForm();
                      setShowAddonForm(true);
                    }}
                    className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold"
                    style={{
                      color: 'var(--primary)',
                      borderColor:
                        'var(--primary)',
                    }}
                  >
                    <Plus size={17} />
                    Novo adicional
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                  <label className="relative block">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={addonSearch}
                      onChange={(event) =>
                        setAddonSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Buscar adicional..."
                      className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:ring-2"
                    />
                  </label>

                  <label>
                    <span className="sr-only">
                      Máximo de adicionais por pedido
                    </span>

                    <Input
                      type="number"
                      min="1"
                      value={maxSelections}
                      onChange={(event) =>
                        setMaxSelections(
                          Math.max(
                            1,
                            Number(
                              event.target.value,
                            ),
                          ),
                        )
                      }
                    />

                    <small className="mt-1 block text-slate-500">
                      Máximo por pedido:{' '}
                      {maxSelections}
                    </small>
                  </label>
                </div>

                {showAddonForm && (
                  <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-black">
                          {editingAddonId
                            ? 'Editar adicional'
                            : 'Cadastrar adicional'}
                        </h4>

                        <p className="text-sm text-slate-500">
                          Depois ele poderá ser usado em
                          qualquer produto.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={closeAddonForm}
                        className="rounded-full bg-white p-2"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                      <Input
                        placeholder="Ex.: Bacon extra"
                        value={addonForm.name}
                        onChange={(event) =>
                          setAddonForm({
                            ...addonForm,
                            name: event.target.value,
                          })
                        }
                      />

                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Valor"
                        value={addonForm.price}
                        onChange={(event) =>
                          setAddonForm({
                            ...addonForm,
                            price: Number(
                              event.target.value,
                            ),
                          })
                        }
                      />

                      <Button
                        type="button"
                        onClick={() =>
                          void saveCatalogAddon()
                        }
                      >
                        {editingAddonId
                          ? 'Atualizar'
                          : 'Cadastrar'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {filteredCatalog.map((item) => {
                    const selected =
                      isAddonSelected(item.id);

                    return (
                      <article
                        key={item.id}
                        className={`rounded-2xl border p-3 transition ${
                          selected
                            ? 'border-transparent bg-orange-50 ring-2'
                            : 'bg-white'
                        } ${
                          !item.available
                            ? 'opacity-60'
                            : ''
                        }`}
                        style={
                          selected
                            ? ({
                                '--tw-ring-color':
                                  'var(--primary)',
                              } as CSSProperties)
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={!item.available}
                            onClick={() =>
                              toggleAddon(item)
                            }
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                              selected
                                ? 'text-white'
                                : 'bg-white'
                            }`}
                            style={
                              selected
                                ? {
                                    backgroundColor:
                                      'var(--primary)',
                                    borderColor:
                                      'var(--primary)',
                                  }
                                : undefined
                            }
                          >
                            {selected ? (
                              <Check size={20} />
                            ) : (
                              <Plus size={20} />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={!item.available}
                            onClick={() =>
                              toggleAddon(item)
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <strong className="block truncate">
                              {item.name}
                            </strong>

                            <span className="text-sm font-bold text-slate-600">
                              {formatCurrency(
                                item.price,
                              )}
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                startEditingAddon(item)
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removeCatalogAddon(
                                  item,
                                )
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-3">
                          <span className="text-xs font-semibold text-slate-500">
                            {selected
                              ? 'Selecionado para este produto'
                              : 'Disponível na biblioteca'}
                          </span>

                          <Toggle
                            checked={item.available}
                            labelOn="Ativo"
                            labelOff="Inativo"
                            onChange={() =>
                              void toggleCatalogAvailability(
                                item,
                              )
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                {!filteredCatalog.length && (
                  <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                    Nenhum adicional encontrado.
                  </div>
                )}

                {addonItems.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-100 p-3">
                    <p className="text-sm font-bold">
                      Selecionados (
                      {addonItems.length})
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {addonItems.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() =>
                            setAddonItems(
                              (current) =>
                                current.filter(
                                  (selected) =>
                                    selected.id !==
                                    item.id,
                                ),
                            )
                          }
                          className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-sm"
                        >
                          {item.name}
                          <X size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <Button
                className="w-full"
                type="submit"
                disabled={savingProduct}
              >
                {savingProduct
                  ? 'Salvando...'
                  : editingId
                    ? 'Salvar produto e adicionais'
                    : 'Adicionar item'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}