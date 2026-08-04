import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Bike,
  CookingPot,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Tags,
  UsersRound,
  UserRoundCog,
  ContactRound,
  X,
} from 'lucide-react';
import type { AdminRole } from '../constants/adminAccess';
import { resolveAdminRole } from '../constants/adminAccess';
import { STORAGE_KEYS } from '../constants/storage';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { storageService } from '../services/storageService';
import { storeService } from '../services/storeService';

interface AdminSession {
  roleId?: string;
}

const links: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AdminRole[];
}> = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['manager'],
  },
  {
    to: '/admin/pedidos',
    label: 'Pedidos',
    icon: ReceiptText,
    roles: ['manager', 'cashier'],
  },
  {
    to: '/admin/caixa',
    label: 'Caixa',
    icon: CookingPot,
    roles: ['manager', 'cashier'],
  },
  {
    to: '/admin/entregas',
    label: 'Entregas',
    icon: Bike,
    roles: ['manager', 'courier'],
  },
  {
    to: '/admin/produtos',
    label: 'Produtos e adicionais',
    icon: Package,
    roles: ['manager'],
  },
  {
    to: '/admin/categorias',
    label: 'Categorias',
    icon: Tags,
    roles: ['manager'],
  },
  {
    to: '/admin/promocoes',
    label: 'Promoções',
    icon: BadgePercent,
    roles: ['manager'],
  },
  {
    to: '/admin/funcionarios',
    label: 'Funcionários',
    icon: UserRoundCog,
    roles: ['manager'],
  },
  {
    to: '/admin/entregadores',
    label: 'Entregadores',
    icon: ContactRound,
    roles: ['manager'],
  },
  {
    to: '/admin/cargos',
    label: 'Cargos',
    icon: UsersRound,
    roles: ['manager'],
  },
  {
    to: '/admin/configuracoes',
    label: 'Configurações',
    icon: Settings,
    roles: ['manager'],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = configService.get();
  const currentStore = storeService.getCurrent();
  const session = storageService.get<AdminSession | null>(
    STORAGE_KEYS.ADMIN_SESSION,
    null,
  );
  const currentRole = resolveAdminRole(session?.roleId);
  const visibleLinks = links.filter((link) => link.roles.includes(currentRole));

  function logout() {
    authService.adminLogout();
    navigate('/admin/login');
  }

  const sidebar = (
    <aside className="flex h-full w-[82vw] max-w-72 flex-col bg-slate-900 p-5 text-white shadow-2xl lg:min-h-screen lg:w-64 lg:max-w-none lg:shadow-none">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Painel ADM</h1>
          <p className="mt-1 text-xs text-slate-400">{currentStore.name}</p>
        </div>
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
          className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
        >
          <X />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            end={to === '/admin'}
            to={to}
            onClick={() => setMenuOpen(false)}
            style={({ isActive }) =>
              isActive ? { backgroundColor: 'var(--primary)' } : {}
            }
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? 'text-white'
                  : 'text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="mt-5 flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-slate-800"
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  );

  return (
    <div
      style={{ '--primary': config.primaryColor } as React.CSSProperties}
      className="min-h-screen bg-slate-100 lg:flex"
    >
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu administrativo"
          className="rounded-xl border p-2 text-slate-700 active:scale-95"
        >
          <Menu />
        </button>
        <div>
          <p className="text-xs font-medium text-slate-500">Administração</p>
          <h1 className="font-black text-slate-900">{currentStore.name}</h1>
        </div>
      </header>

      <div className="hidden lg:block">{sidebar}</div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/55"
          />
          <div className="admin-drawer-enter relative h-full">{sidebar}</div>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
