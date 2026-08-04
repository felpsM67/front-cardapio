import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, CartOptionItem, Product } from '../models';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from '../services/storageService';

type CartContextValue = {
  items: CartItem[];
  add: (
    product: Product,
    quantity?: number,
    notes?: string,
    options?: CartOptionItem[],
  ) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  lastAddedAt: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    storageService.get(STORAGE_KEYS.CART, []),
  );
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const persist = (next: CartItem[]) => {
    setItems(next);
    storageService.set(STORAGE_KEYS.CART, next);
  };

  const add = (
    product: Product,
    quantity = 1,
    notes = '',
    options: CartOptionItem[] = [],
  ) => {
    const optionKey = options
      .map((option) => `${option.id}:${option.quantity}`)
      .sort()
      .join(',');
    const id = `${product.id}-${notes}-${optionKey}`;
    const unitPrice =
      product.price +
      options.reduce(
        (sum, option) => sum + option.price * option.quantity,
        0,
      );
    const found = items.find((item) => item.id === id);

    persist(
      found
        ? items.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [
            ...items,
            {
              id,
              product,
              quantity,
              notes,
              selectedOptions: options,
              unitPrice,
            },
          ],
    );
    setLastAddedAt(Date.now());
  };

  const update = (id: string, quantity: number) =>
    quantity <= 0
      ? remove(id)
      : persist(
          items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        );

  const remove = (id: string) =>
    persist(items.filter((item) => item.id !== id));

  const clear = () => persist([]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    [items],
  );

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        update,
        remove,
        clear,
        subtotal,
        count,
        lastAddedAt,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart fora do provider');
  }

  return context;
};
