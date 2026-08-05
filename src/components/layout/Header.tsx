import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { configService } from '../../services/configService';

export function Header(): React.JSX.Element {
  const { count, lastAddedAt } = useCart();

  const [animating, setAnimating] = useState(false);
  const [storeName, setStoreName] = useState('Cardápio');

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const config = await configService.get();

        setStoreName(config.storeName);
      } catch (error) {
        console.error(
          'Erro ao carregar configurações da loja:',
          error,
        );
      }
    }

    void loadConfig();
  }, []);

  useEffect(() => {
    if (!lastAddedAt) return;

    setAnimating(false);

    const start = window.setTimeout(() => {
      setAnimating(true);
    }, 20);

    const stop = window.setTimeout(() => {
      setAnimating(false);
    }, 850);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [lastAddedAt]);

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="text-xl font-black"
          style={{
            color: 'var(--primary)',
          }}
        >
          {storeName}
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/login"
            title="Área administrativa"
            className="rounded-full p-2 hover:bg-slate-100"
          >
            <ShieldCheck />
          </Link>

          <Link
            to="/carrinho"
            aria-label={`Abrir sacola com ${count} item(ns)`}
            className={`relative rounded-full p-2 hover:bg-slate-100 ${
              animating ? 'cart-bag-added' : ''
            }`}
          >
            <ShoppingBag
              className={
                animating
                  ? 'cart-bag-icon-added'
                  : ''
              }
            />

            <span
              style={{
                backgroundColor: 'var(--primary)',
              }}
              className={`absolute -right-1 -top-1 rounded-full px-1.5 text-xs text-white ${
                animating ? 'cart-count-added' : ''
              }`}
            >
              {count}
            </span>

            {animating && (
              <span
                className="cart-added-feedback"
                aria-hidden="true"
              >
                +1
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}