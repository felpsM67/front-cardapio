import { ShoppingBag, X } from 'lucide-react';
import type { Product, Promotion } from '../../models';
import { formatCurrency } from '../../utils/format';

interface PromotionModalProps {
  promotion: Promotion;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product, promotionalPrice: number) => void;
}

export function PromotionModal({
  promotion,
  products,
  onClose,
  onSelectProduct,
}: PromotionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-2xl sm:rounded-3xl">
        <div className="relative">
          <img
            src={promotion.imageUrl}
            alt={promotion.title}
            className="aspect-[16/8] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"
            aria-label="Fechar promoção"
          >
            <X />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              {promotion.badge}
            </span>
            <h2 className="mt-2 text-2xl font-black">{promotion.title}</h2>
            <p className="mt-1 text-white/90">{promotion.description}</p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <h3 className="text-lg font-black">Escolha um item</h3>
            <p className="text-sm text-slate-500">
              O valor anterior aparece riscado e o preço promocional em destaque.
            </p>
          </div>

          {products.map((product) => {
            const promotionalPrice = promotion.promotionalPrices[product.id];
            const hasDiscount =
              promotionalPrice > 0 && promotionalPrice < product.price;

            return (
              <article
                key={product.id}
                className="flex items-center gap-3 rounded-2xl border p-3"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-black">{product.name}</h4>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {product.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                    <strong style={{ color: 'var(--primary)' }}>
                      {formatCurrency(
                        hasDiscount ? promotionalPrice : product.price,
                      )}
                    </strong>
                    {hasDiscount && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-black text-green-700">
                        Oferta
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    onSelectProduct(
                      product,
                      hasDiscount ? promotionalPrice : product.price,
                    )
                  }
                  className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <ShoppingBag size={16} />
                  Adicionar
                </button>
              </article>
            );
          })}

          {!products.length && (
            <p className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-500">
              Nenhum produto disponível nesta promoção.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
