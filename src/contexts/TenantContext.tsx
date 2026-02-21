import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { TenantSettings, RoleConfig } from '../types';

const ALL_PAGE_KEYS = [
  'dashboard', 'students', 'admissions', 'attendance', 'homework',
  'payment-schedules', 'payments', 'tickets', 'announcements', 'settings', 'tenants',
  'tenant-manage',
];

interface AdminTenantItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface TenantContextType {
  settings: TenantSettings | null;
  schoolName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  classes: string[];
  subjects: string[];
  sections: string[];
  academicYears: string[];
  currencySymbol: string;
  roles: RoleConfig[];
  allowedPages: string[];
  isLoading: boolean;
  adminTenants: AdminTenantItem[];
  adminSelectedTenantId: string;
  setAdminSelectedTenantId: (id: string) => void;
}

const defaultSettings: TenantContextType = {
  settings: null,
  schoolName: 'ERP Admin',
  logo: '',
  primaryColor: '#4F46E5',
  secondaryColor: '#7C3AED',
  classes: ['Playgroup', 'Nursery', 'LKG', 'UKG'],
  subjects: ['English', 'Math', 'Science', 'Art', 'Music', 'General'],
  sections: ['A'],
  academicYears: ['2025-26', '2026-27'],
  currencySymbol: '₹',
  roles: [],
  allowedPages: [],
  isLoading: true,
  adminTenants: [],
  adminSelectedTenantId: '',
  setAdminSelectedTenantId: () => {},
};

const TenantContext = createContext<TenantContextType>(defaultSettings);

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { tenant, isAuthenticated, user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [contextValue, setContextValue] = useState<TenantContextType>(defaultSettings);
  const [adminTenants, setAdminTenants] = useState<AdminTenantItem[]>([]);
  const [adminSelectedTenantId, setAdminSelectedTenantIdState] = useState(
    () => localStorage.getItem('adminSelectedTenantId') || '',
  );

  const setAdminSelectedTenantId = useCallback((id: string) => {
    if (id) {
      localStorage.setItem('adminSelectedTenantId', id);
    } else {
      localStorage.removeItem('adminSelectedTenantId');
    }
    setAdminSelectedTenantIdState(id);
    // invalidateQueries forces all active (mounted) queries to refetch
    // with the new X-Tenant-Id header from localStorage
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Fetch tenant list for super_admin
  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      tenantApi.getAll().then((res) => {
        setAdminTenants(res.data || []);
      }).catch(() => {});
    }
  }, [isAuthenticated, isSuperAdmin]);

  // Clear admin tenant selection on logout
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem('adminSelectedTenantId');
      setAdminSelectedTenantIdState('');
      setAdminTenants([]);
    }
  }, [isAuthenticated]);

  // Fetch settings: either from JWT-based tenant or admin-selected tenant
  useEffect(() => {
    const hasTenantContext = isSuperAdmin ? !!adminSelectedTenantId : !!tenant;

    if (isAuthenticated && hasTenantContext) {
      const fetchFn = isSuperAdmin && adminSelectedTenantId
        ? tenantApi.getSettingsById(adminSelectedTenantId)
        : tenantApi.getSettings();

      fetchFn.then((res) => {
        const data = res.data;
        const roles: RoleConfig[] = data.roles || [];
        const userRole = user?.role || '';
        const roleConfig = roles.find((r) => r.name === userRole);
        const allowedPages = isSuperAdmin
          ? ALL_PAGE_KEYS
          : (roleConfig?.permissions?.pages || []);

        setContextValue((prev) => ({
          ...prev,
          settings: data,
          schoolName: data.name || tenant?.name || 'ERP Admin',
          logo: data.logo || tenant?.logo || '',
          primaryColor: data.primaryColor || tenant?.primaryColor || '#4F46E5',
          secondaryColor: data.secondaryColor || tenant?.secondaryColor || '#7C3AED',
          classes: data.classes || defaultSettings.classes,
          subjects: data.subjects || defaultSettings.subjects,
          sections: data.sections || defaultSettings.sections,
          academicYears: data.academicYears || defaultSettings.academicYears,
          currencySymbol: data.currencySymbol || '₹',
          roles,
          allowedPages,
          isLoading: false,
          adminTenants,
          adminSelectedTenantId,
          setAdminSelectedTenantId,
        }));
      }).catch(() => {
        setContextValue((prev) => ({
          ...prev,
          schoolName: tenant?.name || 'ERP Admin',
          isLoading: false,
          adminTenants,
          adminSelectedTenantId,
          setAdminSelectedTenantId,
        }));
      });
    } else if (isAuthenticated) {
      setContextValue((prev) => ({
        ...prev,
        isLoading: false,
        allowedPages: isSuperAdmin ? ALL_PAGE_KEYS : prev.allowedPages,
        adminTenants,
        adminSelectedTenantId,
        setAdminSelectedTenantId,
      }));
    }
  }, [isAuthenticated, tenant, user, isSuperAdmin, adminSelectedTenantId, adminTenants, setAdminSelectedTenantId]);

  // Keep adminTenants and selection in sync with context value
  useEffect(() => {
    setContextValue((prev) => ({
      ...prev,
      adminTenants,
      adminSelectedTenantId,
      setAdminSelectedTenantId,
    }));
  }, [adminTenants, adminSelectedTenantId, setAdminSelectedTenantId]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
