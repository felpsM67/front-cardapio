import type { AddonCatalogItem } from '../models';
import { apiClient } from '../api/apiClient';

const CATALOG_ENDPOINT = '/adicionais';

interface BackendAdicional {
  id: number;
  nomeAdicional: string;
  valor: number | string;
  disponivel: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AdicionalPayload {
  nomeAdicional?: string;
  valor?: number;
  disponivel?: boolean;
}

function normalizeCatalogItem(item: BackendAdicional): AddonCatalogItem {
  const timestamp = new Date().toISOString();

  return {
    id: String(item.id),
    name: item.nomeAdicional,
    price: Number(item.valor),
    available: Boolean(item.disponivel),
    createdAt: item.createdAt ?? timestamp,
    updatedAt: item.updatedAt ?? timestamp,
  };
}

function buildCreatePayload(
  data: Pick<AddonCatalogItem, 'name' | 'price' | 'available'>,
): AdicionalPayload {
  return {
    nomeAdicional: data.name,
    valor: data.price,
    disponivel: data.available,
  };
}

function buildUpdatePayload(
  data: Partial<Pick<AddonCatalogItem, 'name' | 'price' | 'available'>>,
): AdicionalPayload {
  const payload: AdicionalPayload = {};

  if (data.name !== undefined) {
    payload.nomeAdicional = data.name;
  }

  if (data.price !== undefined) {
    payload.valor = data.price;
  }

  if (data.available !== undefined) {
    payload.disponivel = data.available;
  }

  return payload;
}

export const addonCatalogService = {
  async getAll(): Promise<AddonCatalogItem[]> {
    const response =
      await apiClient.get<BackendAdicional[]>(CATALOG_ENDPOINT);

    return response.map(normalizeCatalogItem);
  },

  async getById(id: string): Promise<AddonCatalogItem> {
    const response = await apiClient.get<BackendAdicional>(
      `${CATALOG_ENDPOINT}/${encodeURIComponent(id)}`,
    );

    return normalizeCatalogItem(response);
  },

  async create(
    data: Pick<AddonCatalogItem, 'name' | 'price' | 'available'>,
  ): Promise<AddonCatalogItem> {
    const payload = buildCreatePayload(data);

    const response = await apiClient.post<BackendAdicional>(
      CATALOG_ENDPOINT,
      payload,
    );

    return normalizeCatalogItem(response);
  },

  async update(
    id: string,
    data: Partial<Pick<AddonCatalogItem, 'name' | 'price' | 'available'>>,
  ): Promise<AddonCatalogItem> {
    const payload = buildUpdatePayload(data);

    const response = await apiClient.put<BackendAdicional>(
      `${CATALOG_ENDPOINT}/${encodeURIComponent(id)}`,
      payload,
    );

    return normalizeCatalogItem(response);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(
      `${CATALOG_ENDPOINT}/${encodeURIComponent(id)}`,
    );
  },
};