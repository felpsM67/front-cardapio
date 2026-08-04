import type { Product } from '../models';
import { productRepository } from '../repositories/productRepository';

export const productService = {
  initialize: () => productRepository.load(),
  getAll: () => productRepository.getAll().sort((a, b) => a.order - b.order),
  getById: (id: string) =>
    productRepository.getAll().find((product) => product.id === id),
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    productRepository.create(data),
  update: (id: string, data: Partial<Product>) =>
    productRepository.update(id, data),
  remove: (id: string) => productRepository.remove(id),
  async toggleAvailability(id: string): Promise<void> {
    const product = productRepository
      .getAll()
      .find((item) => item.id === id);
    if (!product) return;
    await productRepository.update(id, { available: !product.available });
  },
};
