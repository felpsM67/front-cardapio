import { useMemo, useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCog,
  X,
} from 'lucide-react';
import type { Employee, EmployeeStatus, Role } from '../../models';
import { employeeService } from '../../services/employeeService';
import { roleService } from '../../services/roleService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const emptyForm = {
  name: '',
  username: '',
  password: '',
  phone: '',
  roleId: '',
  status: 'active' as EmployeeStatus,
};

export function EmployeesPage() {
  const [, refresh] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
const [roles, setRoles] = useState<Role[]>([]);
const [rolesError, setRolesError] = useState("");

useEffect(() => {
  async function carregarCargos(): Promise<void> {
    try {
      const cargos = await roleService.getAll();
      setRoles(cargos);
    } catch (error) {
      setRolesError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os cargos.",
      );
    }
  }

  void carregarCargos();
}, []);
  const employees = employeeService.getAll();

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return employees;

    return employees.filter((employee) =>
      [employee.name, employee.username, employee.phone]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  }, [employees, search]);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, roleId: roles[0]?.id ?? '' });
    setShowPassword(false);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      username: employee.username,
      password: employee.password,
      phone: employee.phone,
      roleId: employee.roleId,
      status: employee.status,
    });
    setShowPassword(false);
    setFormError('');
    setModalOpen(true);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');

    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.password ||
      !form.roleId
    ) {
      setFormError('Preencha nome, usuário, senha e cargo.');
      return;
    }

    if (form.username.trim().length < 3) {
      setFormError('O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(form.username.trim())) {
      setFormError(
        'O usuário pode conter apenas letras, números, ponto, hífen e sublinhado.',
      );
      return;
    }

    if (form.password.length < 4) {
      setFormError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (employeeService.usernameExists(form.username, editingId ?? undefined)) {
      setFormError('Esse nome de usuário já está sendo utilizado.');
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
    };

    if (editingId) employeeService.update(editingId, data);
    else employeeService.create(data);

    setModalOpen(false);
    refresh((value) => value + 1);
  }

  function toggle(employee: Employee) {
    employeeService.update(employee.id, {
      status: employee.status === 'active' ? 'inactive' : 'active',
    });
    refresh((value) => value + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <UserRoundCog size={32} />
            <h1 className="text-3xl font-black">Funcionários</h1>
          </div>
          <p className="mt-1 text-slate-500">
            Cadastre o acesso, a senha e o cargo de cada funcionário.
          </p>
        </div>

        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={18} /> Novo funcionário
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, usuário ou telefone"
          className="border-0 p-0 focus:ring-0"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((employee) => {
          const role = roles.find((item) => item.id === employee.roleId);
          const active = employee.status === 'active';

          return (
            <article
              key={employee.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black">
                    {employee.name}
                  </h2>
                  <p className="truncate text-sm font-bold text-slate-700">
                    @{employee.username}
                  </p>
                  <p className="text-sm text-slate-500">
                    {employee.phone || 'Sem telefone'}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Cargo
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {role?.name ?? 'Cargo removido'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {role?.description}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(employee)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold hover:bg-slate-50"
                >
                  <Pencil size={16} /> Editar
                </button>

                <button
                  onClick={() => toggle(employee)}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    active
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {active ? 'Desativar' : 'Ativar'}
                </button>

                {employee.id !== 'employee-admin' && (
                  <button
                    onClick={() =>
                      confirm('Excluir este funcionário?') &&
                      (employeeService.remove(employee.id),
                      refresh((value) => value + 1))
                    }
                    className="rounded-xl bg-red-50 p-2 text-red-600"
                    aria-label="Excluir funcionário"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={save}
            className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {editingId ? 'Editar funcionário' : 'Novo funcionário'}
                </h2>
                <p className="text-sm text-slate-500">
                  O usuário e a senha serão utilizados no login administrativo.
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

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
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
                Nome de usuário
                <Input
                  required
                  minLength={3}
                  autoComplete="off"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  placeholder="Ex.: joao.caixa"
                />
                <span className="text-xs font-normal text-slate-500">
                  Aceita letras, números, ponto, hífen e sublinhado.
                </span>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Senha de acesso
                <div className="relative">
                  <Input
                    required
                    minLength={4}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>


              <label className="grid gap-2 text-sm font-bold">
                Telefone
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Cargo
                <select
                  required
                  value={form.roleId}
                  onChange={(event) =>
                    setForm({ ...form, roleId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Selecione um cargo</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Situação
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as EmployeeStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </label>

              {formError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border px-4 py-3 font-bold"
              >
                Cancelar
              </button>
              <Button className="flex-1">Salvar funcionário</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
