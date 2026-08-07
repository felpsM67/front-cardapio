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

  return (
    <div>
      {/* CAPA */}

      <section className="relative h-52 overflow-hidden bg-slate-900 sm:h-64">
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
          <div className="h-full w-full bg-slate-800" />
        )}

        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-6 text-white">
          <span
            className={`mb-2 w-fit rounded-full px-3 py-1 text-sm ${
              config.isOpen
                ? 'bg-green-600'
                : 'bg-red-600'
            }`}
          >
            {config.isOpen
              ? 'Aberto agora'
              : 'Fechado'}
          </span>

          <h1 className="text-3xl font-black">
            {config.storeName ||
              'Cardápio'}
          </h1>

          <p>
            {config.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock size={18} />

              {config.openingHours ||
                'Horário não informado'}
            </span>

            <span className="flex items-center gap-1">
              <Truck size={18} />

              {formatCurrency(
                config.deliveryFee,
              )}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
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

        {/* BUSCA */}

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Buscar no cardápio"
            className="w-full rounded-2xl border py-3 pl-12 pr-4 outline-none focus:ring-2"
          />
        </div>

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

        <div className="grid gap-3 md:grid-cols-2">
          {filteredProducts.map(
            (product) => (
              <ProductCard
                key={
                  product.id
                }
                product={
                  product
                }
                promotions={
                  promotions
                }
              />
            ),
          )}
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