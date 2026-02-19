import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Calendar, DollarSign, LucideIcon } from 'lucide-react';
import { reportsApi } from '../services/api';
import { DashboardStats } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingPage } from '../components/ui/Spinner';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  helpText?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const StatCard = ({ label, value, helpText, icon: Icon, iconBg, iconColor }: StatCardProps) => (
  <Card>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
      </div>
      <div className={cn('rounded-lg p-3', iconBg)}>
        <Icon className={cn('h-6 w-6', iconColor)} />
      </div>
    </div>
  </Card>
);

export const Dashboard = () => {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await reportsApi.getDashboard();
      return res.data;
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <StatCard
          label="Total Students"
          value={data?.totalStudents || 0}
          helpText={`${data?.activeStudents || 0} active`}
          icon={Users}
          iconBg="bg-brand-50"
          iconColor="text-brand-500"
        />
        <StatCard
          label="Pending Admissions"
          value={data?.pendingAdmissions || 0}
          helpText="Awaiting review"
          icon={UserPlus}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
        <StatCard
          label="Today's Attendance"
          value={`${data?.todayAttendance?.present || 0}/${data?.todayAttendance?.total || 0}`}
          helpText={`${data?.todayAttendance?.absent || 0} absent`}
          icon={Calendar}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${(data?.monthlyRevenue || 0).toLocaleString()}`}
          helpText={`${data?.pendingPayments || 0} pending`}
          icon={DollarSign}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </div>
    </div>
  );
};
