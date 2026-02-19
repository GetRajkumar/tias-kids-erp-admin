import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Search, Eye, MessageSquare, Pencil } from 'lucide-react';
import { admissionsApi } from '../services/api';
import { Admission, AdmissionComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { LoadingPage } from '../components/ui/Spinner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/DropdownMenu';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  under_review: 'blue',
  approved: 'green',
  rejected: 'red',
};

export const Admissions = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selected, setSelected] = useState<Admission | null>(null);
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [commentsHistory, setCommentsHistory] = useState<AdmissionComment[]>([]);
  const [isDirectComment, setIsDirectComment] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions'],
    queryFn: async () => {
      const res = await admissionsApi.getAll();
      return res.data;
    },
  });

  // Filter admissions based on all filters
  const filteredAdmissions = useMemo(() => {
    if (!admissions) return [];

    return admissions.filter((admission) => {
      // Status filter
      if (statusFilter && admission.status !== statusFilter) return false;

      // Class filter
      if (classFilter && admission.preferredClass !== classFilter) return false;

      // Search filter (search in child name, parent name, email, phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const childName = `${admission.childFirstName} ${admission.childLastName}`.toLowerCase();
        const parentName = `${admission.parentFirstName} ${admission.parentLastName}`.toLowerCase();
        const email = admission.parentEmail.toLowerCase();
        const phone = admission.parentPhone.toLowerCase();

        if (
          !childName.includes(query) &&
          !parentName.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [admissions, statusFilter, classFilter, searchQuery]);

  // Get unique classes for filter
  const availableClasses = useMemo(() => {
    if (!admissions) return [];
    const classes = new Set(admissions.map((a) => a.preferredClass).filter(Boolean));
    return Array.from(classes).sort();
  }, [admissions]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment: string }) =>
      admissionsApi.updateStatus(id, status, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Status updated successfully', status: 'success' });
      setComment('');
      setSelectedStatus('');
      setIsDirectComment(false);
      
      // If status is approved, close the sheet
      if (variables.status === 'approved') {
        setSheetOpen(false);
        setSelected(null);
        toast({ 
          title: 'Admission Approved!', 
          description: 'No further comments can be added to this admission.',
          status: 'success' 
        });
      } else {
        // Refresh comments in-place for other status changes
        if (selected) {
          admissionsApi.getComments(selected._id).then((res) => setCommentsHistory(res.data));
        }
      }
    },
    onError: () => {
      toast({ title: 'Failed to update status', status: 'error' });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      admissionsApi.addComment(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Comment added successfully', status: 'success' });
      setComment('');
      setIsDirectComment(false);
      // Refresh comments in-place
      if (selected) {
        admissionsApi.getComments(selected._id).then((res) => setCommentsHistory(res.data));
      }
    },
    onError: () => {
      toast({ title: 'Failed to add comment', status: 'error' });
    },
  });

  const handleStatusChangeInSheet = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setIsDirectComment(false);
  };

  const handleSubmitComment = () => {
    if (!selected || !comment) return;

    if (isDirectComment) {
      addCommentMutation.mutate({ id: selected._id, comment });
    } else if (selectedStatus) {
      updateStatusMutation.mutate({
        id: selected._id,
        status: selectedStatus,
        comment,
      });
    }
  };

  const handleViewDetails = async (admission: Admission) => {
    setSelected(admission);
    setComment('');
    setSelectedStatus('');
    setIsDirectComment(false);
    try {
      const res = await admissionsApi.getComments(admission._id);
      setCommentsHistory(res.data);
      setSheetOpen(true);
    } catch {
      toast({ title: 'Failed to fetch comments', status: 'error' });
    }
  };

  const handleStatusChangeFromTable = (admission: Admission, newStatus: string) => {
    // Open the sheet with status change pre-selected
    setSelected(admission);
    setSelectedStatus(newStatus);
    setIsDirectComment(false);
    setComment('');
    admissionsApi
      .getComments(admission._id)
      .then((res) => {
        setCommentsHistory(res.data);
        setSheetOpen(true);
      })
      .catch(() => {
        toast({ title: 'Failed to fetch comments', status: 'error' });
      });
  };

  const handleAddCommentFromTable = (admission: Admission) => {
    setSelected(admission);
    setIsDirectComment(true);
    setSelectedStatus('');
    setComment('');
    admissionsApi
      .getComments(admission._id)
      .then((res) => {
        setCommentsHistory(res.data);
        setSheetOpen(true);
      })
      .catch(() => {
        toast({ title: 'Failed to fetch comments', status: 'error' });
      });
  };

  const canManageAdmissions = user?.role === 'super_admin' || user?.role === 'admin';

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      {/* Header + Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="sm:w-64"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="sm:w-44"
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Showing {filteredAdmissions.length} of {admissions?.length || 0} enquiries
        </p>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <Thead>
            <Tr>
              <Th>Child Name</Th>
              <Th>Parent</Th>
              <Th className="hidden md:table-cell">Contact</Th>
              <Th className="hidden lg:table-cell">Preferred Class</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Updated Date</Th>
              <Th className="text-center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredAdmissions.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="py-8 text-center text-gray-500">
                  No enquiries found
                </Td>
              </Tr>
            ) : (
              filteredAdmissions.map((admission) => (
                <Tr key={admission._id}>
                  <Td>
                    <span className="font-medium text-gray-900">
                      {admission.childFirstName} {admission.childLastName}
                    </span>
                  </Td>
                  <Td>
                    {admission.parentFirstName} {admission.parentLastName}
                  </Td>
                  <Td className="hidden md:table-cell">
                    <div className="text-sm">{admission.parentEmail}</div>
                    <div className="text-xs text-gray-400">{admission.parentPhone}</div>
                  </Td>
                  <Td className="hidden lg:table-cell">{admission.preferredClass || '-'}</Td>
                  <Td>
                    <Badge color={statusColors[admission.status]}>
                      {admission.status.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <div className="text-sm">
                      {new Date(admission.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(admission.updatedAt).toLocaleTimeString()}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        title="View Details"
                        onClick={() => handleViewDetails(admission)}
                        icon={<Eye className="h-4 w-4" />}
                      />

                      {canManageAdmissions && admission.status !== 'approved' && (
                        <>
                          <Button
                            variant="ghost"
                            size="xs"
                            title="Add Comment"
                            onClick={() => handleAddCommentFromTable(admission)}
                            icon={<MessageSquare className="h-4 w-4" />}
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="xs"
                                title="Change Status"
                                icon={<Pencil className="h-4 w-4" />}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => handleStatusChangeFromTable(admission, 'pending')}
                              >
                                <Badge color="yellow">pending</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleStatusChangeFromTable(admission, 'under_review')
                                }
                              >
                                <Badge color="blue">under review</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleStatusChangeFromTable(admission, 'approved')}
                              >
                                <Badge color="green">approved</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleStatusChangeFromTable(admission, 'rejected')}
                              >
                                <Badge color="red">rejected</Badge>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Detail Sheet (replaces both modals) */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        side="right"
        size="lg"
        title={
          selected
            ? `Admission Details — ${selected.childFirstName} ${selected.childLastName}`
            : 'Admission Details'
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Admission Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Applicant Info
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Child Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.childFirstName} {selected.childLastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selected.childDateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Parent Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.parentFirstName} {selected.parentLastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900">{selected.parentEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{selected.parentPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Preferred Class</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.preferredClass || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Current Status:</span>
                <Badge color={statusColors[selected.status]} size="md">
                  {selected.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Status Change + Comment (inline, no nested modal) */}
            {canManageAdmissions && selected.status !== 'approved' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {isDirectComment ? 'Add Comment' : selectedStatus ? 'Update Status' : 'Manage Admission'}
                </h3>

                {/* Status selector buttons */}
                {!isDirectComment && (
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'under_review', 'approved', 'rejected'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChangeInSheet(s)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-all',
                          selectedStatus === s
                            ? 'ring-2 ring-brand-500 bg-brand-50 text-brand-700'
                            : 'ring-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                        )}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mode toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={isDirectComment ? 'primary' : 'secondary'}
                    size="xs"
                    onClick={() => {
                      setIsDirectComment(true);
                      setSelectedStatus('');
                    }}
                  >
                    Add Comment
                  </Button>
                  <Button
                    variant={!isDirectComment ? 'primary' : 'secondary'}
                    size="xs"
                    onClick={() => {
                      setIsDirectComment(false);
                    }}
                  >
                    Change Status
                  </Button>
                </div>

                {selectedStatus && !isDirectComment && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">New status:</span>
                    <Badge color={statusColors[selectedStatus]} size="md">
                      {selectedStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                )}

                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isDirectComment
                      ? 'Add your comment here...'
                      : 'Please provide a comment for this status change...'
                  }
                  rows={3}
                />
                <Button
                  onClick={handleSubmitComment}
                  loading={updateStatusMutation.isPending || addCommentMutation.isPending}
                  disabled={!comment || (!isDirectComment && !selectedStatus)}
                  size="sm"
                >
                  {isDirectComment ? 'Add Comment' : 'Update Status'}
                </Button>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Approved Status Message */}
            {selected.status === 'approved' && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Badge color="green" size="md">Approved</Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      This admission has been approved.
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      No further status changes or comments can be made to this admission.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comments History (inline) */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Comments History
              </h3>
              {commentsHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {commentsHistory.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge color={statusColors[item.status]}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(item.commentedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mb-1 text-sm text-gray-700">{item.comment}</p>
                      <p className="text-xs text-gray-500">
                        By: {item.commentedBy.firstName} {item.commentedBy.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
