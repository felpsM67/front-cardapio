import { useMemo, useState } from 'react';
import { Clock, MousePointerClick, Search, Sparkles, Truck } from 'lucide-react';
import type { Product, Promotion } from '../../models';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { configService } from '../../services/configService';
import { promotionService } from '../../services/promotionService';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductModal } from '../../components/products/ProductModal';
import { PromotionModal } from '../../components/products/PromotionModal';
import { formatCurrency } from '../../utils/format';

export function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedPromotion, setSelectedPromotion] =
    useState<Promotion | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product;
    originalPrice?: number;
  } | null>(null);

  const config = configService.get();
  const products = productService.getAll();
  const categories = categoryService.getAll().filter((item) => item.active);
  const promotions = promotionService.getAll().filter((item) => item.active);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.available &&
          (category === 'all' || product.categoryId === category) &&
          `${product.name} ${product.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [products, category, search],
  );

  const promotionProducts = useMemo(() => {
    if (!selectedPromotion) return [];

    return selectedPromotion.productIds
      .map((id) => products.find((product) => product.id === id))
      .filter(
        (product): product is Product => Boolean(product?.available),
      );
  }, [products, selectedPromotion]);

  function openPromotion(promotion: Promotion) {
    if (!promotion.clickable) return;
    setSelectedPromotion(promotion);
  }

  function selectPromotionProduct(product: Product, promotionalPrice: number) {
    setSelectedPromotion(null);
    setSelectedProduct({
      product: { ...product, price: promotionalPrice },
      originalPrice: product.price,
    });
  }

  return (
    <div>
      <section className="relative h-52 overflow-hidden sm:h-64">
        <img
          src={config.coverUrl}
          alt={config.storeName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-6 text-white">
          <span
            className={`mb-2 w-fit rounded-full px-3 py-1 text-sm ${
              config.isOpen ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {config.isOpen ? 'Aberto agora' : 'Fechado'}
          </span>
          <h1 className="text-3xl font-black">{config.storeName}</h1>
          <p>{config.description}</p>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="flex gap-1">
              <Clock size={18} />
              {config.estimatedTime}
            </span>
            <span className="flex gap-1">
              <Truck size={18} />
              {formatCurrency(config.deliveryFee)}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {promotions.length > 0 && (
          <section className="mb-7">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles style={{ color: 'var(--primary)' }} />
              <h2 className="text-2xl font-black">Promoções e destaques</h2>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-3">
              {promotions.map((promotion) => (
                <article
                  key={promotion.id}
                  role={promotion.clickable ? 'button' : undefined}
                  tabIndex={promotion.clickable ? 0 : undefined}
                  onClick={() => openPromotion(promotion)}
                  onKeyDown={(event) => {
                    if (
                      promotion.clickable &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      openPromotion(promotion);
                    }
                  }}
                  className={`relative min-w-[85%] snap-start overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md sm:min-w-[460px] ${
                    promotion.clickable
                      ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg'
                      : ''
                  }`}
                >
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    className="h-48 w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {promotion.clickable && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-md">
                      <MousePointerClick size={14} />
                      Clique para adicionar ao carrinho!
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                      {promotion.badge}
                    </span>
                    <h3 className="mt-2 text-2xl font-black">
                      {promotion.title}
                    </h3>
                    <p className="mt-1 text-sm text-white/85">
                      {promotion.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar no cardápio"
            className="w-full rounded-2xl border py-3 pl-12 pr-4"
          />
        </div>

        <div className="my-5 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory('all')}
            style={
              category === 'all'
                ? { backgroundColor: 'var(--primary)' }
                : {}
            }
            className={`whitespace-nowrap rounded-full px-4 py-2 ${
              category === 'all' ? 'text-white' : 'bg-slate-100'
            }`}
          >
            Todos
          </button>

          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              style={
                category === item.id
                  ? { backgroundColor: 'var(--primary)' }
                  : {}
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 ${
                category === item.id ? 'text-white' : 'bg-slate-100'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!filteredProducts.length && (
          <p className="py-16 text-center text-slate-500">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      {selectedPromotion && (
        <PromotionModal
          promotion={selectedPromotion}
          products={promotionProducts}
          onClose={() => setSelectedPromotion(null)}
          onSelectProduct={selectPromotionProduct}
        />
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product}
          originalPrice={selectedProduct.originalPrice}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
