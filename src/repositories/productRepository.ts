import type { Product } from '../models';
import { apiClient } from '../api/apiClient';
import { mockProducts } from '../data/mockProducts';
import { categoryRepository } from './categoryRepository';

interface ApiProduct {
  id: number;
  nome: string;
  cozinha?: string;
  descricao_resumida?: string;
  descricao_detalhada?: string;
  imagem?: string | null;
  valor: number | string;
  categoriaId: number | null;
  disponivel?: boolean;
  destaque?: boolean;
  ordem?: number;
  createdAt?: string;
  updatedAt?: string;
}

let products: Product[] = [];

function mapProduct(item: ApiProduct): Product {
  const now = new Date().toISOString();

  return {
    id: String(item.id),
    name: item.nome,
    description: item.descricao_detalhada ?? item.descricao_resumida ?? '',
    price: Number(item.valor),
    imageUrl: item.imagem ?? '',
    categoryId: item.categoriaId ? String(item.categoriaId) : '',
    available: item.disponivel ?? true,
    featured: item.destaque ?? false,
    order: item.ordem ?? item.id,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  };
}

function toApiProduct(data: Partial<Product>) {
  const description = data.description?.trim() || 'Sem descrição';
  const category = categoryRepository
    .getAll()
    .find((item) => item.id === data.categoryId);

  return {
    nome: data.name,
    cozinha: category?.name ?? 'Cardápio',
    descricao_resumida: description.slice(0, 255),
    descricao_detalhada: description,
    imagem: data.imageUrl || null,
    valor: data.price,
    categoriaId: Number(data.categoryId),
    disponivel: data.available,
    destaque: data.featured,
    ordem: data.order,
  };
}

export const productRepository = {
  getAll: () => [...products],

  async load(): Promise<void> {
    try {
      const response = await apiClient.get<ApiProduct[]>('/pratos');
      products = response.map(mapProduct);
      return;
    } catch (error) {
      console.warn('Usando dados locais para produtos porque a API não respondeu.', error);
    }

    products = mockProducts.map((item) => ({ ...item }));
  },

  async create(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Product> {
    const response = await apiClient.post<ApiProduct>(
      '/pratos',
      toApiProduct(data),
    );
    const created = mapProduct(response);
    products = [...products, created];
    return created;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const current = products.find((item) => item.id === id);
    if (!current) throw new Error('Produto não encontrado no frontend.');

    const response = await apiClient.put<ApiProduct>(
      `/pratos/${encodeURIComponent(id)}`,
      toApiProduct({ ...current, ...data }),
    );
    const updated = mapProduct(response);
    products = products.map((item) => (item.id === id ? updated : item));
    return updated;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/pratos/${encodeURIComponent(id)}`);
    products = products.filter((item) => item.id !== id);
  },
};
