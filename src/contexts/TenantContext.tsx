import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tenantApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { TenantSettings, RoleConfig } from '../types';

const ALL_PAGE_KEYS = [
  'dashboard', 'students', 'admissions', 'attendance', 'homework',
  'payment-schedules', 'payments', 'tickets', 'announcements', 'settings', 'tenants',
];

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
};

const TenantContext = createContext<TenantContextType>(defaultSettings);

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { tenant, isAuthenticated, user, isSuperAdmin } = useAuth();
  const [contextValue, setContextValue] = useState<TenantContextType>(defaultSettings);

  useEffect(() => {
    if (isAuthenticated && tenant) {
      tenantApi.getSettings().then((res) => {
        const data = res.data;
        const roles: RoleConfig[] = data.roles || [];
        const userRole = user?.role || '';
        const roleConfig = roles.find((r) => r.name === userRole);
        const allowedPages = isSuperAdmin
          ? ALL_PAGE_KEYS
          : (roleConfig?.permissions?.pages || []);

        setContextValue({
          settings: data,
          schoolName: data.name || tenant.name || 'ERP Admin',
          logo: data.logo || tenant.logo || '',
          primaryColor: data.primaryColor || tenant.primaryColor || '#4F46E5',
          secondaryColor: data.secondaryColor || tenant.secondaryColor || '#7C3AED',
          classes: data.classes || defaultSettings.classes,
          subjects: data.subjects || defaultSettings.subjects,
          sections: data.sections || defaultSettings.sections,
          academicYears: data.academicYears || defaultSettings.academicYears,
          currencySymbol: data.currencySymbol || '₹',
          roles,
          allowedPages,
          isLoading: false,
        });
      }).catch(() => {
        setContextValue((prev) => ({
          ...prev,
          schoolName: tenant.name || 'ERP Admin',
          isLoading: false,
        }));
      });
    } else if (isAuthenticated) {
      setContextValue((prev) => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, tenant, user, isSuperAdmin]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
