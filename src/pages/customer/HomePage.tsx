import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Clock,
  MousePointerClick,
  Search,
  Sparkles,
  Truck,
} from 'lucide-react';

import type {
  Product,
  Promotion,
  StoreConfig,
} from '../../models';

import { categoryService } from '../../services/categoryService';
import { configService } from '../../services/configService';
import { productService } from '../../services/productService';
import { promotionService } from '../../services/promotionService';

import { ProductCard } from '../../components/products/ProductCard';
import { ProductModal } from '../../components/products/ProductModal';
import { PromotionModal } from '../../components/products/PromotionModal';

import { formatCurrency } from '../../utils/format';

interface CategoryItem {
  id: string;
  name: string;
  active: boolean;
}

const initialConfig: StoreConfig = {
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

function HomeSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="h-52 bg-slate-300 sm:h-64" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-7">
          <div className="mb-3 h-8 w-64 rounded-lg bg-slate-200" />

          <div className="flex gap-4 overflow-hidden">
            <div className="h-48 min-w-[85%] rounded-2xl bg-slate-200 sm:min-w-[460px]" />

            <div className="hidden h-48 min-w-[460px] rounded-2xl bg-slate-200 sm:block" />
          </div>
        </div>

        <div className="h-12 w-full rounded-2xl bg-slate-200" />

        <div className="my-5 flex gap-2 overflow-hidden">
          <div className="h-10 w-24 shrink-0 rounded-full bg-slate-200" />
          <div className="h-10 w-28 shrink-0 rounded-full bg-slate-200" />
          <div className="h-10 w-24 shrink-0 rounded-full bg-slate-200" />
          <div className="h-10 w-32 shrink-0 rounded-full bg-slate-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="flex gap-3 rounded-2xl border bg-white p-3"
            >
              <div className="h-28 w-28 shrink-0 rounded-xl bg-slate-200 sm:h-32 sm:w-32" />

              <div className="flex flex-1 flex-col">
                <div className="h-5 w-2/3 rounded bg-slate-200" />

                <div className="mt-3 h-4 w-full rounded bg-slate-200" />

                <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />

                <div className="mt-auto flex items-end justify-between pt-4">
                  <div className="h-6 w-24 rounded bg-slate-200" />

                  <div className="h-9 w-24 rounded-lg bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage(): React.JSX.Element {
  const [config, setConfig] =
    useState<StoreConfig>(initialConfig);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<CategoryItem[]>([]);

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [category, setCategory] =
    useState('all');

  const [
    selectedPromotion,
    setSelectedPromotion,
  ] = useState<Promotion | null>(null);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<{
    product: Product;
    originalPrice?: number;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function reloadPromotions(): Promise<void> {
      try {
        const items =
          await promotionService.getAll();

        if (!active) {
          return;
        }

        setPromotions(
          items.filter(
            (item) => item.active,
          ),
        );
      } catch (error) {
        console.error(
          'Erro ao carregar promoções:',
          error,
        );
      }
    }

    async function loadPage(): Promise<void> {
      setLoading(true);

      try {
        const [
          loadedProducts,
          loadedCategories,
          loadedConfig,
        ] = await Promise.all([
          Promise.resolve(
            productService.getAll(),
          ),

          Promise.resolve(
            categoryService.getAll(),
          ),

          configService.get(),
        ]);

        if (!active) {
          return;
        }

        setProducts(
          loadedProducts,
        );

        setCategories(
          loadedCategories.filter(
            (item) => item.active,
          ),
        );

        setConfig(
          loadedConfig,
        );
      } catch (error) {
        console.error(
          'Erro ao carregar cardápio:',
          error,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      /*
       * Promoções são secundárias.
       * Carregam depois sem segurar o skeleton.
       */
      void reloadPromotions();
    }

    function handlePromotionUpdate(): void {
      void reloadPromotions();
    }

    function handleConfigUpdate(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<StoreConfig>;

      if (
        active &&
        customEvent.detail
      ) {
        setConfig(
          customEvent.detail,
        );
      }
    }

    void loadPage();

    window.addEventListener(
      promotionService.updatedEvent,
      handlePromotionUpdate,
    );

    window.addEventListener(
      'store-config-updated',
      handleConfigUpdate,
    );

    return () => {
      active = false;

      window.removeEventListener(
        promotionService.updatedEvent,
        handlePromotionUpdate,
      );

      window.removeEventListener(
        'store-config-updated',
        handleConfigUpdate,
      );
    };
  }, []);

  const filteredProducts =
    useMemo(() => {
      const query = search
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        );

      return products.filter(
        (product) => {
          const searchableContent = `
            ${product.name ?? ''}
            ${product.description ?? ''}
          `.toLocaleLowerCase(
            'pt-BR',
          );

          const belongsToSelectedCategory =
            category === 'all' ||
            product.categoryId ===
              category;

          return (
            product.available &&
            belongsToSelectedCategory &&
            searchableContent.includes(
              query,
            )
          );
        },
      );
    }, [
      products,
      category,
      search,
    ]);

  const productGroups = useMemo(() => {
    const visibleCategories =
      category === 'all'
        ? categories
        : categories.filter(
            (item) => item.id === category,
          );

    const groups = visibleCategories
      .map((item) => ({
        id: item.id,
        name: item.name,
        products: filteredProducts.filter(
          (product) =>
            product.categoryId === item.id,
        ),
      }))
      .filter((group) => group.products.length > 0);

    if (category === 'all') {
      const categoryIds = new Set(
        categories.map((item) => item.id),
      );
      const uncategorizedProducts = filteredProducts.filter(
        (product) => !categoryIds.has(product.categoryId),
      );

      if (uncategorizedProducts.length > 0) {
        groups.push({
          id: 'uncategorized',
          name: 'Outros',
          products: uncategorizedProducts,
        });
      }
    }

    return groups;
  }, [categories, category, filteredProducts]);

  const promotionProducts =
    useMemo(() => {
      if (!selectedPromotion) {
        return [];
      }

      return selectedPromotion.productIds
        .map((productId) =>
          products.find(
            (product) =>
              product.id ===
              productId,
          ),
        )
        .filter(
          (
            product,
          ): product is Product =>
            Boolean(
              product?.available,
            ),
        );
    }, [
      products,
      selectedPromotion,
    ]);

  function openPromotion(
    promotion: Promotion,
  ): void {
    if (!promotion.clickable) {
      return;
    }

    setSelectedPromotion(
      promotion,
    );
  }

  function selectPromotionProduct(
    product: Product,
    promotionalPrice: number,
  ): void {
    setSelectedPromotion(null);

    setSelectedProduct({
      product: {
        ...product,
        price:
          promotionalPrice,
      },

      originalPrice:
        product.price,
    });
  }

  if (loading) {
    return <HomeSkeleton />;
  }

  const storeInitial =
    config.storeName.trim().charAt(0).toUpperCase() ||
    'L';

  return (
    <div>
      {/* CAPA */}

      <section className="border-b border-slate-200 bg-white">
        <div className="relative h-36 overflow-hidden bg-slate-200 sm:h-48">
          {config.coverUrl ? (
            <img
              src={config.coverUrl}
              alt={
                config.storeName ||
                'Capa da loja'
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary), #0f172a)',
              }}
            />
          )}

          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="-mt-9 flex items-end justify-between gap-4 sm:-mt-10">
            <div
              aria-hidden="true"
              className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-white text-3xl font-black text-white shadow-md sm:h-24 sm:w-24"
              style={{
                backgroundColor:
                  'var(--primary)',
              }}
            >
              {storeInitial}
            </div>

            <span
              className={`mb-1 flex items-center gap-2 text-sm font-semibold ${
                config.isOpen
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />

              {config.isOpen
                ? 'Aberto agora'
                : 'Fechado'}
            </span>
          </div>

          <div className="pb-5 pt-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {config.storeName ||
                'Cardápio'}
            </h1>

            {config.description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                {config.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock size={16} />

                {config.openingHours ||
                  'Horário não informado'}
              </span>

              <span className="flex items-center gap-1.5">
                <Truck size={16} />

                {config.deliveryFee > 0
                  ? `Entrega ${formatCurrency(
                      config.deliveryFee,
                    )}`
                  : 'Entrega grátis'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* BUSCA */}

        <div className="relative mb-7">
          <Search className="absolute left-4 top-3.5 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Buscar no cardápio"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2"
          />
        </div>

        {/* PROMOÇÕES */}

        {promotions.length > 0 && (
          <section className="mb-7">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles
                style={{
                  color:
                    'var(--primary)',
                }}
              />

              <h2 className="text-2xl font-black">
                Promoções e destaques
              </h2>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-3">
              {promotions.map(
                (promotion) => (
                  <article
                    key={
                      promotion.id
                    }
                    role={
                      promotion.clickable
                        ? 'button'
                        : undefined
                    }
                    tabIndex={
                      promotion.clickable
                        ? 0
                        : undefined
                    }
                    onClick={() =>
                      openPromotion(
                        promotion,
                      )
                    }
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        promotion.clickable &&
                        (
                          event.key ===
                            'Enter' ||
                          event.key ===
                            ' '
                        )
                      ) {
                        event.preventDefault();

                        openPromotion(
                          promotion,
                        );
                      }
                    }}
                    className={`relative min-w-[85%] snap-start overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md sm:min-w-[460px] ${
                      promotion.clickable
                        ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg'
                        : ''
                    }`}
                  >
                    <img
                      src={
                        promotion.imageUrl
                      }
                      alt={
                        promotion.title
                      }
                      loading="lazy"
                      className="h-48 w-full object-cover opacity-60"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {promotion.clickable && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-md">
                        <MousePointerClick
                          size={14}
                        />

                        Ver oferta
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                        {
                          promotion.badge
                        }
                      </span>

                      <h3 className="mt-2 text-2xl font-black">
                        {
                          promotion.title
                        }
                      </h3>

                      <p className="mt-1 text-sm text-white/85">
                        {
                          promotion.description
                        }
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )}

        {/* CATEGORIAS */}

        <div className="my-5 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() =>
              setCategory(
                'all',
              )
            }
            style={
              category === 'all'
                ? {
                    backgroundColor:
                      'var(--primary)',
                  }
                : undefined
            }
            className={`whitespace-nowrap rounded-full px-4 py-2 ${
              category === 'all'
                ? 'text-white'
                : 'bg-slate-100'
            }`}
          >
            Todos
          </button>

          {categories.map(
            (
              categoryItem,
            ) => (
              <button
                key={
                  categoryItem.id
                }
                type="button"
                onClick={() =>
                  setCategory(
                    categoryItem.id,
                  )
                }
                style={
                  category ===
                  categoryItem.id
                    ? {
                        backgroundColor:
                          'var(--primary)',
                      }
                    : undefined
                }
                className={`whitespace-nowrap rounded-full px-4 py-2 ${
                  category ===
                  categoryItem.id
                    ? 'text-white'
                    : 'bg-slate-100'
                }`}
              >
                {
                  categoryItem.name
                }
              </button>
            ),
          )}
        </div>

        {/* PRODUTOS */}

        <div className="space-y-9">
          {productGroups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={`category-${group.id}`}
              className="scroll-mt-24"
            >
              <div className="mb-3 flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
                <h2
                  id={`category-${group.id}`}
                  className="text-2xl font-black text-slate-900"
                >
                  {group.name}
                </h2>
                <span className="text-sm font-semibold text-slate-400">
                  {group.products.length}{' '}
                  {group.products.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    promotions={promotions}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {!filteredProducts.length && (
          <p className="py-16 text-center text-slate-500">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      {/* MODAL DA PROMOÇÃO */}

      {selectedPromotion && (
        <PromotionModal
          promotion={
            selectedPromotion
          }
          products={
            promotionProducts
          }
          onClose={() =>
            setSelectedPromotion(
              null,
            )
          }
          onSelectProduct={
            selectPromotionProduct
          }
        />
      )}

      {/* MODAL DO PRODUTO */}

      {selectedProduct && (
        <ProductModal
          product={
            selectedProduct.product
          }
          originalPrice={
            selectedProduct.originalPrice
          }
          onClose={() =>
            setSelectedProduct(
              null,
            )
          }
        />
      )}
    </div>
  );
}
