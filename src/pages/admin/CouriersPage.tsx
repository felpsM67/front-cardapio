import { useMemo, useState } from 'react';
import { Bike, Pencil, Search, Trash2, X } from 'lucide-react';
import type { Courier } from '../../models';
import { courierService } from '../../services/courierService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { onlyDigits } from '../../utils/format';

const emptyForm = {
  name: '',
  phone: '',
  vehicleModel: '',
  plate: '',
  active: true,
};

export function CouriersPage() {
  const [, refresh] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const couriers = courierService.getAll();

  const filtered = useMemo(() => {
    const value = String(search ?? '').trim().toLowerCase();
    if (!value) return couriers;

    return couriers.filter((courier) =>
      [courier.name, courier.phone, courier.plate, courier.vehicleModel]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  }, [couriers, search]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(courier: Courier) {
    setEditingId(courier.id);
    setForm({
      name: courier.name,
      phone: courier.phone,
      vehicleModel: courier.vehicleModel,
      plate: courier.plate ?? '',
      active: courier.active,
    });
    setModalOpen(true);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.vehicleModel.trim()) {
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      phone: onlyDigits(form.phone),
      vehicleModel: form.vehicleModel.trim(),
      plate: form.plate.trim().toUpperCase(),
    };

    if (editingId) courierService.update(editingId, data);
    else courierService.create(data);

    setModalOpen(false);
    refresh((value) => value + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Bike size={32} />
            <h1 className="text-3xl font-black">Cadastro de entregadores</h1>
          </div>
          <p className="mt-1 text-slate-500">
            Gerencie os entregadores e o modelo do veículo utilizado.
          </p>
        </div>

      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, telefone, modelo ou placa"
          className="border-0 p-0 focus:ring-0"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((courier) => (
          <article
            key={courier.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{courier.name}</h2>
                <p className="text-sm text-slate-500">{courier.phone}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  courier.active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {courier.active ? 'Disponível' : 'Inativo'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Modelo do veículo
                </p>
                <p className="font-bold">
                  {courier.vehicleModel || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Placa
                </p>
                <p className="font-bold">
                  {courier.plate || 'Não informada'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(courier)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"
              >
                <Pencil size={16} /> Editar
              </button>
              <button
                onClick={() => {
                  courierService.update(courier.id, {
                    active: !courier.active,
                  });
                  refresh((value) => value + 1);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  courier.active
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {courier.active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() =>
                  confirm('Excluir este entregador?') &&
                  (courierService.remove(courier.id),
                  refresh((value) => value + 1))
                }
                className="rounded-xl bg-red-50 p-2 text-red-600"
                aria-label="Excluir entregador"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4">
          <form
            onSubmit={save}
            className="w-full max-w-xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {editingId ? 'Editar entregador' : 'Novo entregador'}
                </h2>
                <p className="text-sm text-slate-500">
                  Informe os dados pessoais e o modelo do veículo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold sm:col-span-2">
                Nome completo
                <Input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Telefone
                <Input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  placeholder="67999999999"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: onlyDigits(event.target.value).slice(0, 11),
                    })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Modelo do veículo
                <Input
                  required
                  value={form.vehicleModel}
                  onChange={(event) =>
                    setForm({ ...form, vehicleModel: event.target.value })
                  }
                  placeholder="Ex.: Honda CG 160"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Placa (opcional)
                <Input
                  value={form.plate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      plate: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ABC1D23"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                />
                Entregador disponível
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border px-4 py-3 font-bold"
              >
                Cancelar
              </button>
              <Button className="flex-1">Salvar entregador</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
