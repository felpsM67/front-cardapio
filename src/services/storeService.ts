export interface StoreTenant {
  id: string;
  name: string;
  slug: string;
}

const STORE_LIST: StoreTenant[] = [
  { id: 'store-sabor-express', name: 'Sabor Express', slug: 'sabor-express' },
  { id: 'store-burger-house', name: 'Burger House', slug: 'burger-house' },
];

let selectedStoreId = STORE_LIST[0].id;

function storeFromUrl(): StoreTenant | undefined {
  if (typeof window === 'undefined') return undefined;
  const slug = new URLSearchParams(window.location.search).get('loja');
  return STORE_LIST.find((store) => store.slug === slug);
}

function getCurrentStore(): StoreTenant {
  const fromUrl = storeFromUrl();
  if (fromUrl) selectedStoreId = fromUrl.id;

  return (
    STORE_LIST.find((store) => store.id === selectedStoreId) ?? STORE_LIST[0]
  );
}

export const storeService = {
  getAll: () => STORE_LIST,
  getCurrent: getCurrentStore,
  setCurrent: (storeId: string) => {
    const store = STORE_LIST.find((item) => item.id === storeId) ?? STORE_LIST[0];
    selectedStoreId = store.id;
    return store;
  },
  getStorageKey: (key: string) => `${getCurrentStore().id}:${key}`,
};
