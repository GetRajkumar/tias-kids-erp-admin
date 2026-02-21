import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X, Info, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { tenantApi } from '../services/api';
import { RoleConfig, RolePermissions } from '../types';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Checkbox } from '../components/ui/Checkbox';
import { Spinner, LoadingPage } from '../components/ui/Spinner';
import { Sheet } from '../components/ui/Sheet';

const ALL_PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Students' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'homework', label: 'Homework' },
  { key: 'payment-schedules', label: 'Fee Schedules' },
  { key: 'payments', label: 'Payments' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'settings', label: 'Settings' },
];

const PERMISSION_KEYS: { key: keyof RolePermissions; label: string }[] = [
  { key: 'canManageStudents', label: 'Manage Students' },
  { key: 'canManageAdmissions', label: 'Manage Admissions' },
  { key: 'canManageAttendance', label: 'Manage Attendance' },
  { key: 'canManagePayments', label: 'Manage Payments' },
  { key: 'canManageHomework', label: 'Manage Homework' },
  { key: 'canManageAnnouncements', label: 'Manage Announcements' },
  { key: 'canManageTickets', label: 'Manage Tickets' },
  { key: 'canManageSettings', label: 'Manage Settings' },
  { key: 'canManageUsers', label: 'Manage Users' },
];

// ─── School Profile Tab ─────────────────────────────────────────────
const TenantProfileTab = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings-admin', tenantId],
    queryFn: () => tenantApi.getSettingsById(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        logo: settings.logo || '',
        primaryColor: settings.primaryColor || '#4F46E5',
        secondaryColor: settings.secondaryColor || '#7C3AED',
        'address.street': settings.address?.street || '',
        'address.city': settings.address?.city || '',
        'address.state': settings.address?.state || '',
        'address.zipCode': settings.address?.zipCode || '',
        'address.country': settings.address?.country || '',
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => tenantApi.updateSettingsById(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings-admin', tenantId] });
      toast({ title: 'School profile updated', status: 'success' });
    },
    onError: () => toast({ title: 'Failed to update', status: 'error' }),
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      name: data.name,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      logo: data.logo,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      address: {
        street: data['address.street'],
        city: data['address.city'],
        state: data['address.state'],
        zipCode: data['address.zipCode'],
        country: data['address.country'],
      },
    });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="School Name" {...register('name')} />
          <Input label="Contact Email" type="email" {...register('contactEmail')} />
          <Input label="Contact Phone" {...register('contactPhone')} />
          <Input label="Logo URL" {...register('logo')} placeholder="https://..." />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <input type="color" {...register('primaryColor')} className="h-10 w-20 cursor-pointer rounded border border-gray-300 p-1" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <input type="color" {...register('secondaryColor')} className="h-10 w-20 cursor-pointer rounded border border-gray-300 p-1" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Street" {...register('address.street')} />
            <Input label="City" {...register('address.city')} />
            <Input label="State" {...register('address.state')} />
            <Input label="ZIP Code" {...register('address.zipCode')} />
            <Input label="Country" {...register('address.country')} />
          </div>
        </div>
        <Button type="submit" loading={mutation.isPending}>Save Changes</Button>
      </form>
    </Card>
  );
};

// ─── Academic Config Tab ─────────────────────────────────────────────
const TenantAcademicTab = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings-admin', tenantId],
    queryFn: () => tenantApi.getSettingsById(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [newItem, setNewItem] = useState({ classes: '', sections: '', subjects: '', academicYears: '' });

  useEffect(() => {
    if (settings) {
      setClasses(settings.classes || []);
      setSections(settings.sections || []);
      setSubjects(settings.subjects || []);
      setAcademicYears(settings.academicYears || []);
      setCurrency(settings.currency || 'INR');
      setCurrencySymbol(settings.currencySymbol || '₹');
      setTimezone(settings.timezone || 'Asia/Kolkata');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: any) => tenantApi.updateSettingsById(tenantId, { settings: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings-admin', tenantId] });
      toast({ title: 'Academic configuration updated', status: 'success' });
    },
    onError: () => toast({ title: 'Failed to update', status: 'error' }),
  });

  const addItem = (field: 'classes' | 'sections' | 'subjects' | 'academicYears') => {
    const value = newItem[field].trim();
    if (!value) return;
    const setters = { classes: setClasses, sections: setSections, subjects: setSubjects, academicYears: setAcademicYears };
    const getters = { classes, sections, subjects, academicYears };
    if (!getters[field].includes(value)) {
      setters[field]([...getters[field], value]);
    }
    setNewItem((prev) => ({ ...prev, [field]: '' }));
  };

  const removeItem = (field: 'classes' | 'sections' | 'subjects' | 'academicYears', value: string) => {
    const setters = { classes: setClasses, sections: setSections, subjects: setSubjects, academicYears: setAcademicYears };
    const getters = { classes, sections, subjects, academicYears };
    setters[field](getters[field].filter((v) => v !== value));
  };

  const handleSave = () => {
    mutation.mutate({ classes, sections, subjects, academicYears, currency, currencySymbol, timezone });
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  const renderTagList = (field: 'classes' | 'sections' | 'subjects' | 'academicYears', label: string) => {
    const getters = { classes, sections, subjects, academicYears };
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {getters[field].map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
              {item}
              <button type="button" onClick={() => removeItem(field, item)} className="ml-0.5 rounded-full p-0.5 text-brand-500 hover:bg-brand-100 hover:text-brand-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={`Add ${label.toLowerCase()}`}
            value={newItem[field]}
            onChange={(e) => setNewItem((prev) => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(field); } }}
            className="flex-1"
          />
          <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => addItem(field)} />
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderTagList('classes', 'Classes')}
          {renderTagList('sections', 'Sections')}
          {renderTagList('subjects', 'Subjects')}
          {renderTagList('academicYears', 'Academic Years')}
        </div>
        <hr className="border-gray-200" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Currency & Timezone</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Currency Code" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="INR" />
            <Input label="Currency Symbol" value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} placeholder="₹" />
            <Input label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Kolkata" />
          </div>
        </div>
        <Button loading={mutation.isPending} onClick={handleSave}>Save Configuration</Button>
      </div>
    </Card>
  );
};

// ─── Roles & Permissions Tab ─────────────────────────────────────────
const TenantRolesTab = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings-admin', tenantId],
    queryFn: () => tenantApi.getSettingsById(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  const roles: RoleConfig[] = settings?.roles || [];

  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const mutation = useMutation({
    mutationFn: (updatedRoles: RoleConfig[]) =>
      tenantApi.updateSettingsById(tenantId, { settings: { roles: updatedRoles } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings-admin', tenantId] });
      toast({ title: 'Roles updated', status: 'success' });
      setSheetOpen(false);
    },
    onError: () => toast({ title: 'Failed to update roles', status: 'error' }),
  });

  const openCreateSheet = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPages([]);
    setPermissions({});
    setSheetOpen(true);
  };

  const openEditSheet = (role: RoleConfig) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setSelectedPages(role.permissions.pages || []);
    const perms: Record<string, boolean> = {};
    PERMISSION_KEYS.forEach(({ key }) => { perms[key] = (role.permissions as any)[key] || false; });
    setPermissions(perms);
    setSheetOpen(true);
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) return;
    const newPerms: RolePermissions = {
      pages: selectedPages,
      canManageStudents: permissions.canManageStudents || false,
      canManageAdmissions: permissions.canManageAdmissions || false,
      canManageAttendance: permissions.canManageAttendance || false,
      canManagePayments: permissions.canManagePayments || false,
      canManageHomework: permissions.canManageHomework || false,
      canManageAnnouncements: permissions.canManageAnnouncements || false,
      canManageTickets: permissions.canManageTickets || false,
      canManageSettings: permissions.canManageSettings || false,
      canManageUsers: permissions.canManageUsers || false,
    };
    const roleConfig: RoleConfig = {
      name: roleName.toLowerCase().replace(/\s+/g, '_'),
      description: roleDesc,
      isSystem: editingRole?.isSystem || false,
      permissions: newPerms,
    };
    let updatedRoles: RoleConfig[];
    if (editingRole) {
      updatedRoles = roles.map((r) => r.name === editingRole.name ? roleConfig : r);
    } else {
      if (roles.find((r) => r.name === roleConfig.name)) {
        toast({ title: 'Role name already exists', status: 'error' });
        return;
      }
      updatedRoles = [...roles, roleConfig];
    }
    mutation.mutate(updatedRoles);
  };

  const handleDeleteRole = (name: string) => {
    const role = roles.find((r) => r.name === name);
    if (role?.isSystem) { toast({ title: 'Cannot delete system roles', status: 'warning' }); return; }
    if (!confirm(`Delete role "${name}"? Users with this role will lose access.`)) return;
    mutation.mutate(roles.filter((r) => r.name !== name));
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Roles ({roles.length})</h3>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreateSheet}>Create Role</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.name}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{role.name}</h4>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
              <div className="flex items-center gap-1">
                {role.isSystem && <Badge color="gray">System</Badge>}
                <Button variant="ghost" size="xs" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEditSheet(role)} />
                {!role.isSystem && (
                  <Button variant="ghost" size="xs" className="text-red-600 hover:text-red-700 hover:bg-red-50" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => handleDeleteRole(role.name)} />
                )}
              </div>
            </div>
            <hr className="border-gray-200 mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Page Access</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {role.permissions.pages.map((p) => <Badge key={p} color="blue" size="sm">{p}</Badge>)}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Permissions</p>
            <div className="flex flex-wrap gap-1">
              {PERMISSION_KEYS.filter(({ key }) => (role.permissions as any)[key]).map(({ label }) => (
                <Badge key={label} color="green" size="sm">{label}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) setSheetOpen(false); }}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button loading={mutation.isPending} onClick={handleSaveRole}>{editingRole ? 'Update Role' : 'Create Role'}</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. accountant" disabled={editingRole?.isSystem} required />
            <Input label="Description" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="e.g. Handles financial reports" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Page Access</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_PAGES.map(({ key, label }) => (
                <Checkbox key={key} label={label} checked={selectedPages.includes(key)} onCheckedChange={(checked) => {
                  if (checked) setSelectedPages([...selectedPages, key]);
                  else setSelectedPages(selectedPages.filter((p) => p !== key));
                }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Action Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_KEYS.map(({ key, label }) => (
                <Checkbox key={key} label={label} checked={permissions[key] || false} onCheckedChange={(checked) => setPermissions({ ...permissions, [key]: checked })} />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

// ─── Payment Gateway Tab ─────────────────────────────────────────────
const TenantPaymentTab = ({ tenantId }: { tenantId: string }) => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings-admin', tenantId],
    queryFn: () => tenantApi.getSettingsById(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  const { register, handleSubmit, reset, watch, setValue: setFormValue } = useForm();
  const razorpayEnabled = watch('razorpayEnabled');

  useEffect(() => {
    if (settings) {
      reset({
        razorpayKeyId: settings.razorpayKeyId || '',
        razorpayKeySecret: '',
        razorpayEnabled: settings.razorpayEnabled || false,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = { razorpayKeyId: data.razorpayKeyId, razorpayEnabled: data.razorpayEnabled };
      if (data.razorpayKeySecret && !data.razorpayKeySecret.startsWith('••')) {
        payload.razorpayKeySecret = data.razorpayKeySecret;
      }
      return tenantApi.updateSettingsById(tenantId, { settings: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings-admin', tenantId] });
      toast({ title: 'Payment gateway settings updated', status: 'success' });
    },
    onError: () => toast({ title: 'Failed to update', status: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  return (
    <Card>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-900">Razorpay Integration</p>
            <p className="text-sm text-blue-700">
              Enter Razorpay API keys to enable online payments. Get keys from{' '}
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Razorpay Dashboard</a>
            </p>
          </div>
        </div>
        <Checkbox checked={!!razorpayEnabled} onCheckedChange={(checked) => setFormValue('razorpayEnabled', checked)} label="Enable Online Payments via Razorpay" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Razorpay Key ID" {...register('razorpayKeyId')} placeholder="rzp_test_..." className="font-mono" />
          <div>
            <Input label="Razorpay Key Secret" {...register('razorpayKeySecret')} type="password" placeholder={settings?.razorpayKeySecret ? 'Leave blank to keep existing' : 'Enter key secret'} className="font-mono" />
            {settings?.razorpayKeySecret && <p className="text-xs text-gray-500 mt-1">Current: ••••••••</p>}
          </div>
        </div>
        {razorpayEnabled && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700">Online payments are enabled. Parents can pay installments directly from the app.</p>
          </div>
        )}
        <Button type="submit" loading={mutation.isPending}>Save Gateway Settings</Button>
      </form>
    </Card>
  );
};

// ─── Subscription Tab ─────────────────────────────────────────────
const TenantSubscriptionTab = ({ tenantId }: { tenantId: string }) => {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-detail', tenantId],
    queryFn: () => tenantApi.getById(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner size="lg" /></div>;

  const sub = tenant?.subscription || {};

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Plan</label>
          <p className="text-sm font-semibold text-gray-900 capitalize">{sub.plan || 'free'}</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Status</label>
          <div><Badge color={sub.status === 'active' ? 'green' : sub.status === 'trial' ? 'yellow' : 'red'}>{sub.status || 'trial'}</Badge></div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Max Students</label>
          <p className="text-sm font-semibold text-gray-900">{sub.maxStudents || 50}</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Max Staff</label>
          <p className="text-sm font-semibold text-gray-900">{sub.maxStaff || 10}</p>
        </div>
        {sub.startDate && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <p className="text-sm font-semibold text-gray-900">{new Date(sub.startDate).toLocaleDateString()}</p>
          </div>
        )}
        {sub.endDate && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">End Date</label>
            <p className="text-sm font-semibold text-gray-900">{new Date(sub.endDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Subscription management is read-only. Update subscription details directly in the database.</p>
        </div>
      </div>
    </Card>
  );
};

// ─── Main Page ─────────────────────────────────────────────
export const TenantManage = () => {
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll().then((r) => r.data),
  });

  if (isLoading) return <LoadingPage />;

  const selectedTenant = tenants?.find((t: any) => t._id === selectedTenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Tenant Settings</h1>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <Select
              label="Select Tenant"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
            >
              <option value="">-- Select a school --</option>
              {tenants?.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.slug}) {!t.isActive ? ' [Inactive]' : ''}
                </option>
              ))}
            </Select>
          </div>
          {selectedTenant && (
            <div className="flex items-center gap-2 pt-5">
              <Badge color={selectedTenant.isActive ? 'green' : 'red'}>
                {selectedTenant.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge color="purple">{selectedTenant.subscription?.plan || 'free'}</Badge>
            </div>
          )}
        </div>
      </Card>

      {!selectedTenantId && (
        <Card>
          <div className="py-12 text-center text-gray-400">
            Select a tenant from the dropdown above to view and edit its settings.
          </div>
        </Card>
      )}

      {selectedTenantId && (
        <Tabs defaultValue="profile" key={selectedTenantId}>
          <TabsList>
            <TabsTrigger value="profile">School Profile</TabsTrigger>
            <TabsTrigger value="academic">Academic Config</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="payment">Payment Gateway</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <TenantProfileTab tenantId={selectedTenantId} />
          </TabsContent>
          <TabsContent value="academic">
            <TenantAcademicTab tenantId={selectedTenantId} />
          </TabsContent>
          <TabsContent value="roles">
            <TenantRolesTab tenantId={selectedTenantId} />
          </TabsContent>
          <TabsContent value="payment">
            <TenantPaymentTab tenantId={selectedTenantId} />
          </TabsContent>
          <TabsContent value="subscription">
            <TenantSubscriptionTab tenantId={selectedTenantId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
