import {
  useEffect,
  useState,
} from 'react';

import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

import { useCart } from '../../contexts/CartContext';
import { configService } from '../../services/configService';

export function Header(): React.JSX.Element {
  const {
    count,
    lastAddedAt,
  } = useCart();

  const [animating, setAnimating] =
    useState(false);

  const [storeName, setStoreName] =
    useState('');

  const [loadingConfig, setLoadingConfig] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadConfig(): Promise<void> {
      try {
        const config =
          await configService.get();

        if (!active) {
          return;
        }

        setStoreName(
          config.storeName?.trim() ?? '',
        );
      } catch (error) {
        console.error(
          'Erro ao carregar configurações da loja:',
          error,
        );
      } finally {
        if (active) {
          setLoadingConfig(false);
        }
      }
    }

    function handleConfigUpdate(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<{
          storeName?: string;
        }>;

      if (
        customEvent.detail?.storeName
      ) {
        setStoreName(
          customEvent.detail.storeName,
        );
      }
    }

    void loadConfig();

    window.addEventListener(
      'store-config-updated',
      handleConfigUpdate,
    );

    return () => {
      active = false;

      window.removeEventListener(
        'store-config-updated',
        handleConfigUpdate,
      );
    };
  }, []);

  useEffect(() => {
    if (!lastAddedAt) {
      return;
    }

    setAnimating(false);

    const start =
      window.setTimeout(() => {
        setAnimating(true);
      }, 20);

    const stop =
      window.setTimeout(() => {
        setAnimating(false);
      }, 850);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [lastAddedAt]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        <Link
          to="/"
          className="min-w-0"
        >
          {loadingConfig ? (
            <span
              aria-label="Carregando nome da loja"
              className="block h-5 w-32 animate-pulse rounded-md bg-slate-200"
            />
          ) : (
            <span className="block truncate text-lg font-bold text-slate-900 sm:text-xl">
              {storeName}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/carrinho"
            aria-label={`Abrir sacola com ${count} item(ns)`}
            className={`relative grid h-10 w-10 place-items-center rounded-full text-slate-800 transition hover:bg-slate-100 ${
              animating
                ? 'cart-bag-added'
                : ''
            }`}
          >
            <ShoppingBag
              className={
                animating
                  ? 'cart-bag-icon-added'
                  : ''
              }
            />

            {count > 0 && (
              <span
                style={{
                  backgroundColor:
                    'var(--primary)',
                }}
                className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 text-center text-xs font-bold text-white ${
                  animating
                    ? 'cart-count-added'
                    : ''
                }`}
              >
                {count}
              </span>
            )}

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
