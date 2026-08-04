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
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { storeService } from '../services/storeService';

export function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = configService.get();
  const currentStore = storeService.getCurrent();

  const links = [
    ['/admin', 'Dashboard', LayoutDashboard],
    ['/admin/pedidos', 'Pedidos', ReceiptText],
    ['/admin/caixa', 'Caixa', CookingPot],
    ['/admin/entregas', 'Entregas', Bike],
    ['/admin/produtos', 'Produtos e adicionais', Package],
    ['/admin/categorias', 'Categorias', Tags],
    ['/admin/promocoes', 'Promoções', BadgePercent],
    ['/admin/funcionarios', 'Funcionários', UserRoundCog],
    ['/admin/entregadores', 'Entregadores', ContactRound],
    ['/admin/cargos', 'Cargos', UsersRound],
    ['/admin/configuracoes', 'Configurações', Settings],
  ] as const;

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
        {links.map(([to, label, Icon]) => (
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
