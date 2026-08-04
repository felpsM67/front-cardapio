import { categoryService } from './categoryService';
import { productService } from './productService';

export async function initializeApiData(): Promise<void> {
  await categoryService.initialize();
  await productService.initialize();
}
