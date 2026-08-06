import {
  useMemo,
  useState,
} from 'react';

import type {
  Product,
  Promotion,
} from '../../models';

import { formatCurrency } from '../../utils/format';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  product: Product;
  promotions?: Promotion[];
}

function isPromotionCurrentlyValid(
  startsAt?: string,
  endsAt?: string,
): boolean {
  const now = Date.now();

  const startsAtTime = startsAt
    ? new Date(startsAt).getTime()
    : null;

  const endsAtTime = endsAt
    ? new Date(endsAt).getTime()
    : null;

  if (
    startsAtTime !== null &&
    !Number.isNaN(startsAtTime) &&
    now < startsAtTime
  ) {
    return false;
  }

  if (
    endsAtTime !== null &&
    !Number.isNaN(endsAtTime) &&
    now > endsAtTime
  ) {
    return false;
  }

  return true;
}

export function ProductCard({
  product,
  promotions = [],
}: ProductCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  const promotionalPrice = useMemo(() => {
    const promotion = promotions.find(
      (item) => {
        const price =
          item.promotionalPrices?.[
            product.id
          ];

        return (
          item.active &&
          item.clickable &&
          item.productIds.includes(
            product.id,
          ) &&
          isPromotionCurrentlyValid(
            item.startsAt,
            item.endsAt,
          ) &&
          typeof price === 'number' &&
          price > 0 &&
          price < product.price
        );
      },
    );

    return promotion
      ?.promotionalPrices?.[
        product.id
      ];
  }, [
    promotions,
    product.id,
    product.price,
  ]);

  const hasPromotion =
    promotionalPrice !== undefined;

  const displayedProduct: Product =
    promotionalPrice !== undefined
      ? {
          ...product,
          price: promotionalPrice,
        }
      : product;

  function openProduct(): void {
    setOpen(true);
  }

  function closeProduct(): void {
    setOpen(false);
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={openProduct}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            openProduct();
          }
        }}
        className="flex cursor-pointer gap-3 rounded-2xl border bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold">
              {product.name}
            </h3>

            {hasPromotion && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[11px] font-black text-green-700">
                Oferta
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {product.description}
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              {hasPromotion && (
                <span className="block text-sm text-slate-400 line-through">
                  {formatCurrency(
                    product.price,
                  )}
                </span>
              )}

              <strong
                className={
                  hasPromotion
                    ? 'text-lg'
                    : ''
                }
                style={{
                  color: 'var(--primary)',
                }}
              >
                {formatCurrency(
                  displayedProduct.price,
                )}
              </strong>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openProduct();
              }}
              aria-label={`Adicionar ${product.name}`}
              style={{
                backgroundColor:
                  'var(--primary)',
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
            >
              Adicionar
            </button>
          </div>
        </div>
      </article>

      {open && (
        <ProductModal
          product={displayedProduct}
          originalPrice={
            hasPromotion
              ? product.price
              : undefined
          }
          onClose={closeProduct}
        />
      )}
    </>
  );
}