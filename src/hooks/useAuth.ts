import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
  const { user, token, tenant, tenants, requiresTenantSelection, isLoading, error } =
    useSelector((state: RootState) => state.auth);
  return {
    user,
    token,
    tenant,
    tenants,
    requiresTenantSelection,
    isLoading,
    error,
    isAuthenticated: !!token && !requiresTenantSelection,
    isSuperAdmin: user?.role === 'super_admin',
  };
};
