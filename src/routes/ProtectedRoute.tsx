import { Navigate, Outlet } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from '../services/storageService';

interface AdminSession {
  token?: string;
}

export function ProtectedRoute() {
  const session = storageService.get<AdminSession | null>(
    STORAGE_KEYS.ADMIN_SESSION,
    null,
  );

  return session?.token ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
