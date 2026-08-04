import type { Category } from '../models';
import { apiClient } from '../api/apiClient';
import { mockCategories } from '../data/mockCategories';

interface ApiCategory {
  id: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  ativo?: boolean;
  ordem?: number;
}

let categories: Category[] = [];

function mapCategory(item: ApiCategory): Category {
  return {
    id: String(item.id),
    name: item.nome,
    description: item.descricao ?? undefined,
    imageUrl: item.imagem ?? undefined,
    active: item.ativo ?? true,
    order: item.ordem ?? item.id,
  };
}

function toApiCategory(data: Partial<Category>) {
  return {
    nome: data.name,
    descricao: data.description ?? null,
    imagem: data.imageUrl ?? null,
    ativo: data.active,
    ordem: data.order,
  };
}

export const categoryRepository = {
  getAll: () => [...categories],

  async load(): Promise<void> {
    try {
      const response = await apiClient.get<ApiCategory[]>('/categorias');
      categories = response.map(mapCategory);
      return;
    } catch (error) {
      console.warn('Usando dados locais para categorias porque a API não respondeu.', error);
    }

    categories = mockCategories.map((item) => ({ ...item }));
  },

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const response = await apiClient.post<ApiCategory>(
      '/categorias',
      toApiCategory(data),
    );
    const created = mapCategory(response);
    categories = [...categories, created];
    return created;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await apiClient.put<ApiCategory>(
      `/categorias/${encodeURIComponent(id)}`,
      toApiCategory(data),
    );
    const updated = mapCategory(response);
    categories = categories.map((item) => (item.id === id ? updated : item));
    return updated;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categorias/${encodeURIComponent(id)}`);
    categories = categories.filter((item) => item.id !== id);
  },
};
