import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/format';

export function CartAccessBar(): React.JSX.Element | null {
  const cart = useCart();
  const location = useLocation();

  const hiddenRoutes = [
    '/carrinho',
    '/checkout',
    '/identificacao',
    '/pedido/sucesso',
  ];

  const shouldHide = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  if (!cart.count || shouldHide) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <Link
        to="/carrinho"
        aria-label={`Abrir carrinho com ${cart.count} item(ns)`}
        className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl px-4 py-3 text-white shadow-[0_14px_38px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag size={23} />
            <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-black" style={{ color: 'var(--primary)' }}>
              {cart.count}
            </span>
          </span>

          <span className="min-w-0 text-left">
            <strong className="block truncate text-sm font-black sm:text-base">
              Ver carrinho
            </strong>
            <span className="block text-xs font-semibold text-white/85">
              {cart.count} {cart.count === 1 ? 'item' : 'itens'} adicionado{cart.count === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        <strong className="shrink-0 text-base font-black sm:text-lg">
          {formatCurrency(cart.subtotal)}
        </strong>
      </Link>
    </div>
  );
}