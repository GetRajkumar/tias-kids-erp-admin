import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { tenantApi } from '../services/api';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { Card } from '../components/ui/Card';
import { LoadingPage } from '../components/ui/Spinner';
import { useState } from 'react';

interface CreateTenantForm {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

export const Tenants = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<CreateTenantForm>();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantForm) => tenantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant created', status: 'success' });
      reset();
      setSheetOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: err.response?.data?.message || 'Failed to create tenant',
        status: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant deleted', status: 'success' });
    },
  });

  const onSubmit = (data: CreateTenantForm) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setSheetOpen(true)}>
          Add School
        </Button>
      </div>

      <Card padding={false}>
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Slug</Th>
              <Th className="hidden md:table-cell">Contact</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tenants?.map((t: any) => (
              <Tr key={t._id}>
                <Td>
                  <span className="font-semibold text-gray-900">{t.name}</span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-sm text-gray-500">{t.slug}</span>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="text-sm">{t.contactEmail}</span>
                </Td>
                <Td>
                  <Badge color="purple">{t.subscription?.plan || 'free'}</Badge>
                </Td>
                <Td>
                  <Badge color={t.isActive ? 'green' : 'red'}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this tenant? This will remove all data.')) {
                        deleteMutation.mutate(t._id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
            {(!tenants || tenants.length === 0) && (
              <Tr>
                <Td colSpan={6}>
                  <div className="py-8 text-center text-gray-400">
                    No tenants found. Create your first school.
                  </div>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Create Tenant Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            reset();
            setSheetOpen(false);
          }
        }}
        title="Create New School"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setSheetOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={createMutation.isPending} onClick={handleSubmit(onSubmit)}>
              Create School
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">School Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="School Name"
                {...register('name', { required: true })}
                placeholder="ABC School"
                required
              />
              <Input
                label="Slug (URL identifier)"
                {...register('slug', { required: true })}
                placeholder="abc-school"
                required
              />
              <Input
                label="Contact Email"
                type="email"
                {...register('contactEmail', { required: true })}
                required
              />
              <Input
                label="Contact Phone"
                {...register('contactPhone')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Razorpay Keys (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Razorpay Key ID"
                {...register('razorpayKeyId')}
                placeholder="rzp_test_..."
                className="font-mono"
              />
              <Input
                label="Razorpay Key Secret"
                type="password"
                {...register('razorpayKeySecret')}
                placeholder="Key secret"
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Admin Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register('adminFirstName', { required: true })}
                required
              />
              <Input
                label="Last Name"
                {...register('adminLastName', { required: true })}
                required
              />
              <Input
                label="Admin Email"
                type="email"
                {...register('adminEmail', { required: true })}
                required
              />
              <Input
                label="Password"
                type="password"
                {...register('adminPassword', { required: true })}
                required
              />
            </div>
          </div>
        </form>
      </Sheet>
    </div>
  );
};
