import type { Category } from '../models';
import { categoryRepository } from '../repositories/categoryRepository';

export const categoryService = {
  initialize: () => categoryRepository.load(),
  getAll: () => categoryRepository.getAll().sort((a, b) => a.order - b.order),
  create: (data: Omit<Category, 'id'>) => categoryRepository.create(data),
  update: (id: string, data: Partial<Category>) =>
    categoryRepository.update(id, data),
  remove: (id: string) => categoryRepository.remove(id),
};
