import { useEffect, useState } from "react";

import type { Permission, Role } from "../../models";
import { roleService } from "../../services/roleService";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";

const permissionLabels: Record<Permission, string> = {
  view_dashboard: "Ver dashboard",
  manage_products: "Gerenciar produtos",
  manage_categories: "Gerenciar categorias",
  manage_addons: "Gerenciar adicionais",
  manage_promotions: "Gerenciar promoções",
  view_orders: "Ver pedidos",
  manage_orders: "Atualizar pedidos",
  cancel_orders: "Cancelar pedidos",
  manage_deliveries: "Gerenciar entregas",
  manage_settings: "Alterar configurações",
  manage_roles: "Gerenciar cargos",
  manage_employees: "Gerenciar funcionários",
  manage_couriers: "Gerenciar entregadores",
};

const allPermissions = Object.keys(
  permissionLabels,
) as Permission[];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function carregarCargos(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const cargos = await roleService.getAll();

      setRoles(cargos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os cargos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarCargos();
  }, []);

  async function save(
    event: React.FormEvent,
  ): Promise<void> {
    event.preventDefault();

    if (!name.trim()) {
      setError("Informe o nome do cargo.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const novoCargo = await roleService.create({
        name,
        description,
        permissions,
      });

      setRoles((current) => [...current, novoCargo]);

      setName("");
      setDescription("");
      setPermissions([]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cargo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removerCargo(id: string): Promise<void> {
    const confirmado = window.confirm(
      "Excluir cargo? Funcionários vinculados precisarão receber outro cargo.",
    );

    if (!confirmado) return;

    try {
      setError("");

      await roleService.remove(id);

      setRoles((current) =>
        current.filter((role) => role.id !== id),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o cargo.",
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-black">
        Cargos e permissões
      </h1>

      <p className="mt-1 text-slate-500">
        Crie cargos para depois atribuí-los aos funcionários.
      </p>

      <form
        onSubmit={save}
        className="mt-6 rounded-2xl bg-white p-5 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Nome do cargo"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />

          <Input
            placeholder="Descrição"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allPermissions.map((permission) => (
            <label
              key={permission}
              className="rounded-xl border p-3 text-sm"
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={permissions.includes(permission)}
                onChange={(event) => {
                  setPermissions((current) =>
                    event.target.checked
                      ? [...current, permission]
                      : current.filter(
                          (item) => item !== permission,
                        ),
                  );
                }}
              />

              {permissionLabels[permission]}
            </label>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <Button
          className="mt-4"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Criar cargo"}
        </Button>
      </form>

      {loading ? (
        <p className="mt-6 text-slate-500">
          Carregando cargos...
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <article
              key={role.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {role.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {role.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void removerCargo(role.id);
                  }}
                  className="text-red-600"
                >
                  Excluir
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                  >
                    {permissionLabels[permission]}
                  </span>
                ))}

                {role.permissions.length === 0 && (
                  <span className="text-xs text-slate-400">
                    Nenhuma permissão atribuída
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}