import { useState } from 'react';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function CategoriesPage() {
  const [, refresh] = useState(0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const categories = categoryService.getAll();
  const products = productService.getAll();

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;

    setLoading(true);
    try {
      await categoryService.create({
        name: normalizedName,
        description: '',
        active: true,
        order: categories.length + 1,
      });
      setName('');
      refresh((value) => value + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleCategory(id: string, active: boolean) {
    try {
      await categoryService.update(id, { active: !active });
      refresh((value) => value + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar categoria.');
    }
  }

  async function removeCategory(id: string) {
    if (!confirm('Excluir categoria?')) return;

    try {
      await categoryService.remove(id);
      refresh((value) => value + 1);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir categoria. Verifique se há produtos vinculados.',
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-black">Categorias</h1>

      <form className="mt-6 flex gap-3" onSubmit={createCategory}>
        <Input
          placeholder="Nova categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</Button>
      </form>

      <div className="mt-6 space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-2xl bg-white p-5"
          >
            <div>
              <strong>{category.name}</strong>
              <p className="text-sm text-slate-500">
                {products.filter((product) => product.categoryId === category.id).length}{' '}
                produtos
              </p>
            </div>

            <div className="space-x-3">
              <button
                onClick={() => void toggleCategory(category.id, category.active)}
                className="text-blue-600"
              >
                {category.active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => void removeCategory(category.id)}
                className="text-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {!categories.length && (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">
            Nenhuma categoria cadastrada no backend.
          </div>
        )}
      </div>
    </div>
  );
}
