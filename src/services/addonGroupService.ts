import { apiClient } from '../api/apiClient';
import type {
  AddonGroup,
  ProductOptionItem,
} from '../models';

interface BackendAdicional {
  id: number;
  nomeAdicional: string;
  valor: number | string;
  disponivel: boolean;
}

interface BackendAddonGroup {
  id: number;
  nome: string;
  obrigatorio: boolean;
  maxSelecoes: number;
  ativo: boolean;
  pratoIds: number[];
  adicionalIds: number[];
  items: BackendAdicional[];
}

interface AddonGroupPayload {
  nome: string;
  obrigatorio: boolean;
  maxSelecoes: number;
  ativo: boolean;
  pratoIds: number[];
  adicionalIds: number[];
}

function normalizeItem(
  item: BackendAdicional,
): ProductOptionItem {
  return {
    id: String(item.id),
    name: item.nomeAdicional,
    price: Number(item.valor),
    available: Boolean(item.disponivel),
  };
}

function normalizeGroup(
  group: BackendAddonGroup,
): AddonGroup {
  return {
    id: String(group.id),
    name: group.nome,
    required: Boolean(group.obrigatorio),
    maxSelections: Number(group.maxSelecoes),
    active: Boolean(group.ativo),
    applicableProductIds: (group.pratoIds ?? []).map(String),
    items: (group.items ?? []).map(normalizeItem),
  };
}

function buildPayload(
  group: Omit<AddonGroup, 'id'>,
): AddonGroupPayload {
  return {
    nome: group.name,
    obrigatorio: group.required,
    maxSelecoes: group.maxSelections,
    ativo: group.active,
    pratoIds: group.applicableProductIds.map(Number),
    adicionalIds: group.items.map((item) => Number(item.id)),
  };
}

export const addonGroupService = {
  async getAll(): Promise<AddonGroup[]> {
    const response =
      await apiClient.get<BackendAddonGroup[]>(
        '/grupos-adicionais',
      );

    return response.map(normalizeGroup);
  },

  async getForProduct(
    productId: string,
  ): Promise<AddonGroup[]> {
    const groups = await this.getAll();
    const normalizedProductId = String(productId);

    return groups.filter((group) =>
      group.applicableProductIds.some(
        (id) => String(id) === normalizedProductId,
      ),
    );
  },

  async create(
    group: Omit<AddonGroup, 'id'>,
  ): Promise<AddonGroup> {
    const response =
      await apiClient.post<BackendAddonGroup>(
        '/grupos-adicionais',
        buildPayload(group),
      );

    return normalizeGroup(response);
  },

  async update(
    id: string,
    group: Omit<AddonGroup, 'id'>,
  ): Promise<AddonGroup> {
    const response =
      await apiClient.put<BackendAddonGroup>(
        `/grupos-adicionais/${encodeURIComponent(id)}`,
        buildPayload(group),
      );

    return normalizeGroup(response);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(
      `/grupos-adicionais/${encodeURIComponent(id)}`,
    );
  },
};