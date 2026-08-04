import { Navigate, Outlet } from 'react-router-dom';
import {
  type AdminRole,
  getDefaultAdminPath,
  resolveAdminRole,
} from '../constants/adminAccess';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from '../services/storageService';

interface AdminSession {
  token?: string;
  roleId?: string;
}

function getSession(): AdminSession | null {
  return storageService.get<AdminSession | null>(
    STORAGE_KEYS.ADMIN_SESSION,
    null,
  );
}

export function ProtectedRoute() {
  const session = getSession();

  return session?.token ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export function RoleProtectedRoute({
  allowedRoles,
}: {
  allowedRoles: AdminRole[];
}) {
  const session = getSession();
  const role = resolveAdminRole(session?.roleId);

  if (allowedRoles.includes(role)) return <Outlet />;

  return <Navigate to={getDefaultAdminPath(role)} replace />;
}
