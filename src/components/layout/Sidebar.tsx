import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  CreditCard,
  MessageSquare,
  Settings,
  Bell,
  BookOpen,
  Layers,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/', pageKey: 'dashboard' },
  { icon: Users, label: 'Students', path: '/students', pageKey: 'students' },
  { icon: UserPlus, label: 'Admissions', path: '/admissions', pageKey: 'admissions' },
  { icon: Calendar, label: 'Attendance', path: '/attendance', pageKey: 'attendance' },
  { icon: BookOpen, label: 'Homework', path: '/homework', pageKey: 'homework' },
  { icon: CreditCard, label: 'Fee Schedules', path: '/payment-schedules', pageKey: 'payment-schedules' },
  { icon: DollarSign, label: 'Payments', path: '/payments', pageKey: 'payments' },
  { icon: MessageSquare, label: 'Tickets', path: '/tickets', pageKey: 'tickets' },
  { icon: Bell, label: 'Announcements', path: '/announcements', pageKey: 'announcements' },
];

const superAdminItems = [
  { icon: Layers, label: 'Tenants', path: '/tenants', pageKey: 'tenants' },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const { schoolName, allowedPages } = useTenant();

  const allItems = isSuperAdmin
    ? [...superAdminItems, ...menuItems]
    : menuItems;

  const visibleItems = allowedPages.length > 0
    ? allItems.filter((item) => allowedPages.includes(item.pageKey))
    : allItems;

  const showSettings = isSuperAdmin || allowedPages.includes('settings');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
        <span className="text-xl font-bold text-brand-500 truncate">
          {schoolName}
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col justify-between h-[calc(100%-4rem)]">
        <div className="space-y-1 px-3 pt-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Settings at bottom */}
        {showSettings && (
          <div className="border-t border-gray-200 px-3 py-4">
            <Link
              to="/settings"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                location.pathname === '/settings'
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
};
