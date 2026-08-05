import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';

import type {
  AddonGroup,
  CartOptionItem,
  Product,
  ProductOptionItem,
} from '../../models';
import { addonGroupService } from '../../services/addonGroupService';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../contexts/CartContext';

interface ProductModalProps {
  product: Product;
  originalPrice?: number;
  onClose: () => void;
}

export function ProductModal({
  product,
  originalPrice,
  onClose,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<CartOptionItem[]>([]);
  const { add } = useCart();
  useEffect(() => {
    async function loadGroups(): Promise<void> {
      try {
        setLoadingGroups(true);
        setGroupsError(null);
      
        const response = await addonGroupService.getForProduct(
          product.id,
        );
        console.log('ID do produto:', product.id);
        console.log('Grupos encontrados:', response);

        setGroups(response.filter((group) => group.active));
      } catch (error) {
        console.error('Erro ao carregar adicionais:', error);

        setGroupsError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar adicionais.',
        );
      } finally {
        setLoadingGroups(false);
      }
    }

    void loadGroups();
  }, [product.id]);
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const hasPromotion =
    originalPrice !== undefined && originalPrice > product.price;

  const unitPrice = useMemo(
    () =>
      product.price +
      selected.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [product.price, selected],
  );

  function getSelectedQuantity(itemId: string) {
    return selected.find((item) => item.id === itemId)?.quantity ?? 0;
  }

  function getGroupSelectionCount(groupItemIds: string[]) {
    return selected
      .filter((item) => groupItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function increaseAddon(item: ProductOptionItem, maxSelections: number, groupItemIds: string[]) {
    const currentGroupCount = getGroupSelectionCount(groupItemIds);

    if (currentGroupCount >= maxSelections) {
      return;
    }

    setSelected((current) => {
      const existing = current.find((selectedItem) => selectedItem.id === item.id);

      if (existing) {
        return current.map((selectedItem) =>
          selectedItem.id === item.id
            ? { ...selectedItem, quantity: selectedItem.quantity + 1 }
            : selectedItem,
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function decreaseAddon(itemId: string) {
    setSelected((current) => {
      const existing = current.find((item) => item.id === itemId);

      if (!existing) {
        return current;
      }

      if (existing.quantity <= 1) {
        return current.filter((item) => item.id !== itemId);
      }

      return current.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item,
      );
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-xl sm:rounded-3xl">
        <div className="relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square w-full object-cover sm:max-h-72"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"
            aria-label="Fechar produto"
          >
            <X />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-2xl font-black">{product.name}</h2>
            <p className="mt-2 text-slate-600">{product.description}</p>
            <div className="mt-2 flex items-center gap-2">
              {hasPromotion && (
                <span className="text-sm text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <strong
                className="text-lg"
                style={{ color: 'var(--primary)' }}
              >
                {formatCurrency(product.price)}
              </strong>
              {hasPromotion && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                  Preço promocional
                </span>
              )}
            </div>
          </div>
          {loadingGroups && (
  <div className="flex justify-center py-6">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
  </div>
)}

{!loadingGroups && groupsError && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    {groupsError}
  </div>
)}

{!loadingGroups &&
  !groupsError &&
  groups.map((group) => {
    const availableItems = group.items.filter(
      (item) => item.available,
    );

    const groupItemIds = availableItems.map(
      (item) => item.id,
    );

    const selectedCount =
      getGroupSelectionCount(groupItemIds);

    return (
      <section key={group.id}>
        {/* restante do seu código */}
      </section>
    );
  })}
          {groups.map((group) => {
            const availableItems = group.items.filter((item) => item.available);
            const groupItemIds = availableItems.map((item) => item.id);
            const selectedCount = getGroupSelectionCount(groupItemIds);

            return (
              <section key={group.id}>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{group.name}</h3>
                    <small className="text-slate-500">
                      Escolha até {group.maxSelections} unidade(s)
                    </small>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {selectedCount}/{group.maxSelections}
                  </span>
                </div>

                <div className="space-y-2">
                  {availableItems.map((item) => {
                    const addonQuantity = getSelectedQuantity(item.id);
                    const limitReached = selectedCount >= group.maxSelections;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                          addonQuantity > 0
                            ? 'border-[var(--primary)] bg-orange-50/50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          <span className="text-sm text-slate-500">
                            + {formatCurrency(item.price)} cada
                          </span>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border bg-white p-1">
                          <button
                            type="button"
                            onClick={() => decreaseAddon(item.id)}
                            disabled={addonQuantity === 0}
                            className="rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Diminuir ${item.name}`}
                          >
                            <Minus size={16} />
                          </button>
                          <b className="min-w-6 text-center">{addonQuantity}</b>
                          <button
                            type="button"
                            onClick={() =>
                              increaseAddon(item, group.maxSelections, groupItemIds)
                            }
                            disabled={limitReached}
                            className="rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Aumentar ${item.name}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <label className="block">
            <span className="mb-2 block font-bold">Observações</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: sem cebola, molho separado..."
              className="min-h-24 w-full rounded-xl border p-3"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 rounded-xl border p-2">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </button>
              <b>{quantity}</b>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                add(product, quantity, notes, selected);
                onClose();
              }}
              style={{ backgroundColor: 'var(--primary)' }}
              className="rounded-xl px-5 py-3 font-bold text-white"
            >
              Adicionar · {formatCurrency(unitPrice * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
