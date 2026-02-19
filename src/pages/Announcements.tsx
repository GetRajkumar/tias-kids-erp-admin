import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2, Pencil } from 'lucide-react';
import { announcementsApi } from '../services/api';
import { Announcement } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { Card } from '../components/ui/Card';
import { LoadingPage } from '../components/ui/Spinner';

const typeColors: Record<string, string> = {
  general: 'blue',
  homework: 'purple',
  event: 'green',
  urgent: 'red',
  daily_task: 'orange',
};

export const Announcements = () => {
  const { classes } = useTenant();
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await announcementsApi.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => announcementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement created', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to create announcement', status: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => announcementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement updated', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to update announcement', status: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement deleted', status: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete announcement', status: 'error' });
    },
  });

  const handleClose = () => {
    setEditAnnouncement(null);
    reset();
    setSheetOpen(false);
  };

  const openEditSheet = (announcement: Announcement) => {
    setEditAnnouncement(announcement);
    setValue('title', announcement.title);
    setValue('content', announcement.content);
    setValue('type', announcement.type);
    setValue('targetAudience', announcement.targetAudience);
    setValue('targetClass', announcement.targetClass || '');
    setValue('publishDate', announcement.publishDate.split('T')[0]);
    setValue('expiryDate', announcement.expiryDate?.split('T')[0] || '');
    setValue('isActive', announcement.isActive);
    setSheetOpen(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      publishDate: new Date(data.publishDate).toISOString(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
      isActive: data.isActive === 'true' || data.isActive === true,
    };

    if (editAnnouncement) {
      updateMutation.mutate({ id: editAnnouncement._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <Button onClick={() => setSheetOpen(true)}>Create Announcement</Button>
      </div>

      <Card padding={false}>
        <Table>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th className="hidden md:table-cell">Target</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Publish Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {announcements?.map((announcement) => (
              <Tr key={announcement._id}>
                <Td>
                  <div>
                    <span className="font-medium text-gray-900">{announcement.title}</span>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {announcement.content}
                    </p>
                  </div>
                </Td>
                <Td>
                  <Badge color={typeColors[announcement.type]}>
                    {announcement.type.replace('_', ' ')}
                  </Badge>
                </Td>
                <Td className="hidden md:table-cell">
                  <div>
                    <span>{announcement.targetAudience}</span>
                    {announcement.targetClass && (
                      <p className="text-sm text-gray-500">{announcement.targetClass}</p>
                    )}
                  </div>
                </Td>
                <Td>
                  <Badge color={announcement.isActive ? 'green' : 'gray'}>
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td className="hidden sm:table-cell">
                  {new Date(announcement.publishDate).toLocaleDateString()}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Pencil className="h-4 w-4" />}
                      onClick={() => openEditSheet(announcement)}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this announcement?')) {
                          deleteMutation.mutate(announcement._id);
                        }
                      }}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
            {announcements?.length === 0 && (
              <Tr>
                <Td colSpan={6}>
                  <div className="py-8 text-center text-gray-500">No announcements found</div>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        title={editAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {editAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" {...register('title')} placeholder="Announcement title" required />
          <Textarea
            label="Content"
            {...register('content')}
            placeholder="Announcement content"
            rows={4}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Type" {...register('type')} defaultValue="general" required>
              <option value="general">General</option>
              <option value="homework">Homework</option>
              <option value="event">Event</option>
              <option value="urgent">Urgent</option>
              <option value="daily_task">Daily Task</option>
            </Select>
            <Select label="Target Audience" {...register('targetAudience')} defaultValue="all" required>
              <option value="all">All</option>
              <option value="parents">Parents Only</option>
              <option value="teachers">Teachers Only</option>
              <option value="class">Specific Class</option>
            </Select>
          </div>
          <Select label="Target Class (if applicable)" {...register('targetClass')}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Publish Date" type="date" {...register('publishDate')} required />
            <Input label="Expiry Date" type="date" {...register('expiryDate')} />
          </div>
          <Select label="Status" {...register('isActive')} defaultValue="true">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </form>
      </Sheet>
    </div>
  );
};
