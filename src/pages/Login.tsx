import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, selectTenant, clearError } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { AppDispatch } from '../store';
import { TenantListItem } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, requiresTenantSelection, tenants } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = (data: LoginForm) => {
    dispatch(login(data));
  };

  const onSelectTenant = (tenant: TenantListItem) => {
    dispatch(selectTenant({ tenantSlug: tenant.slug }));
  };

  if (requiresTenantSelection && tenants.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg sm:p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-brand-500">
                Select School
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Choose the school you want to manage
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => onSelectTenant(tenant)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
                >
                  <Avatar name={tenant.name} src={tenant.logo} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {tenant.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Role: {tenant.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-500">
              Kids ERP
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to admin portal
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="********"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={isLoading}
              className="mt-4 w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
