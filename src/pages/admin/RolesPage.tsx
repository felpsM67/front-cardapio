import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Permission, Role } from '../../models';
import { PREDEFINED_ROLES } from '../../constants/predefinedRoles';
import { roleService } from '../../services/roleService';
import { Button } from '../../components/common/Button';

const permissionLabels: Record<Permission, string> = {
  view_dashboard: 'Ver dashboard',
  manage_products: 'Gerenciar produtos',
  manage_categories: 'Gerenciar categorias',
  manage_addons: 'Gerenciar adicionais',
  manage_promotions: 'Gerenciar promoções',
  view_orders: 'Ver pedidos',
  manage_orders: 'Atualizar pedidos',
  cancel_orders: 'Cancelar pedidos',
  manage_deliveries: 'Gerenciar entregas',
  manage_settings: 'Alterar configurações',
  manage_roles: 'Gerenciar cargos',
  manage_employees: 'Gerenciar funcionários',
  manage_couriers: 'Gerenciar entregadores',
};

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function synchronizeRoles(showSuccessMessage = false): Promise<void> {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const synchronizedRoles = await roleService.ensurePredefined();
      setRoles(synchronizedRoles);

      if (showSuccessMessage) {
        setSuccess('Os cargos padrão foram atualizados com sucesso.');
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível sincronizar os cargos padrão.',
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void synchronizeRoles();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} />
            <h1 className="text-3xl font-black">Cargos e permissões</h1>
          </div>
          <p className="mt-1 max-w-2xl text-slate-500">
            O sistema utiliza somente os cargos Gerente, Caixa e Entregador.
            As permissões são definidas automaticamente e não podem ser
            personalizadas nesta tela.
          </p>
        </div>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void synchronizeRoles(true)}
          className="flex items-center gap-2"
        >
          <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Atualizando...' : 'Atualizar cargos padrão'}
        </Button>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Carregando cargos padrão...</p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PREDEFINED_ROLES.map((predefinedRole) => {
            const synchronizedRole = roles.find(
              (role) => role.name === predefinedRole.name,
            );

            return (
              <article
                key={predefinedRole.name}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">
                      {predefinedRole.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {predefinedRole.description}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      synchronizedRole
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {synchronizedRole ? 'Ativo' : 'Pendente'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {predefinedRole.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                    >
                      {permissionLabels[permission]}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
