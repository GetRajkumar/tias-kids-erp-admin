import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2, Pencil, Eye } from 'lucide-react';
import { homeworkApi } from '../services/api';
import { Homework as HomeworkType } from '../types';
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

const subjectColors: Record<string, string> = {
  English: 'blue',
  Math: 'purple',
  Science: 'green',
  Art: 'purple',
  Music: 'orange',
  General: 'gray',
  Hindi: 'yellow',
  EVS: 'green',
};

const Homework = () => {
  const { classes, subjects } = useTenant();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editHomework, setEditHomework] = useState<HomeworkType | null>(null);
  const [viewHomework, setViewHomework] = useState<HomeworkType | null>(null);
  const [gradingStudent, setGradingStudent] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();
  const {
    register: registerGrade,
    handleSubmit: handleGradeSubmit,
    reset: resetGrade,
  } = useForm();

  const { data: homeworkList, isLoading } = useQuery<HomeworkType[]>({
    queryKey: ['homework', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await homeworkApi.getByClass(selectedClass);
      return res.data;
    },
    enabled: !!selectedClass,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => homeworkApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework created', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to create homework', status: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => homeworkApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework updated', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to update homework', status: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework deleted', status: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete homework', status: 'error' });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, studentId, data }: { id: string; studentId: string; data: any }) =>
      homeworkApi.grade(id, studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Submission graded', status: 'success' });
      setGradingStudent(null);
      resetGrade();
    },
    onError: () => {
      toast({ title: 'Failed to grade submission', status: 'error' });
    },
  });

  const handleClose = () => {
    setEditHomework(null);
    reset();
    setSheetOpen(false);
  };

  const handleViewClose = () => {
    setViewHomework(null);
    setGradingStudent(null);
    resetGrade();
    setViewSheetOpen(false);
  };

  const openEditSheet = (homework: HomeworkType) => {
    setEditHomework(homework);
    setValue('title', homework.title);
    setValue('description', homework.description);
    setValue('subject', homework.subject);
    setValue('targetClass', homework.targetClass);
    setValue('dueDate', homework.dueDate.split('T')[0]);
    setValue('isActive', homework.isActive);
    setSheetOpen(true);
  };

  const openViewSheet = (homework: HomeworkType) => {
    setViewHomework(homework);
    setViewSheetOpen(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString(),
      isActive: data.isActive === 'true' || data.isActive === true,
    };

    if (editHomework) {
      updateMutation.mutate({ id: editHomework._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const onGradeSubmit = (data: any) => {
    if (viewHomework && gradingStudent) {
      gradeMutation.mutate({
        id: viewHomework._id,
        studentId: gradingStudent,
        data,
      });
    }
  };

  const getStudentName = (studentId: any): string => {
    if (typeof studentId === 'object' && studentId !== null) {
      return `${studentId.firstName} ${studentId.lastName}`;
    }
    return String(studentId);
  };

  if (isLoading && selectedClass) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
        <Button onClick={() => setSheetOpen(true)}>Create Homework</Button>
      </div>

      <div className="mb-4">
        <Select
          className="w-full sm:w-[300px]"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Filter by class</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </Select>
      </div>

      {!selectedClass ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-gray-500">Select a class to view homework assignments</p>
        </div>
      ) : (
        <Card padding={false}>
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Subject</Th>
                <Th className="hidden md:table-cell">Class</Th>
                <Th className="hidden sm:table-cell">Due Date</Th>
                <Th className="hidden lg:table-cell">Submissions</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {homeworkList?.map((homework) => (
                <Tr key={homework._id}>
                  <Td>
                    <div>
                      <span className="font-medium text-gray-900">{homework.title}</span>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {homework.description}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <Badge color={subjectColors[homework.subject] || 'gray'}>
                      {homework.subject}
                    </Badge>
                  </Td>
                  <Td className="hidden md:table-cell">{homework.targetClass}</Td>
                  <Td className="hidden sm:table-cell">
                    {new Date(homework.dueDate).toLocaleDateString()}
                  </Td>
                  <Td className="hidden lg:table-cell">{homework.submissions?.length || 0}</Td>
                  <Td>
                    <Badge color={homework.isActive ? 'green' : 'gray'}>
                      {homework.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => openViewSheet(homework)}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => openEditSheet(homework)}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this homework?')) {
                            deleteMutation.mutate(homework._id);
                          }
                        }}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
              {homeworkList?.length === 0 && (
                <Tr>
                  <Td colSpan={7}>
                    <div className="py-8 text-center text-gray-500">
                      No homework assignments found
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Create / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        title={editHomework ? 'Edit Homework' : 'Create Homework'}
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
              {editHomework ? 'Update' : 'Create'} Homework
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" {...register('title')} placeholder="Homework title" required />
          <Textarea
            label="Description"
            {...register('description')}
            placeholder="Homework description"
            rows={4}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Subject" {...register('subject')} required>
              <option value="" disabled>
                Select subject
              </option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
            <Select label="Target Class" {...register('targetClass')} required>
              <option value="" disabled>
                Select class
              </option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Due Date" type="date" {...register('dueDate')} required />
          {editHomework && (
            <Select label="Status" {...register('isActive')} defaultValue="true">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          )}
        </form>
      </Sheet>

      {/* View Submissions Sheet */}
      <Sheet
        open={viewSheetOpen}
        onOpenChange={(open) => {
          if (!open) handleViewClose();
        }}
        title={`Submissions - ${viewHomework?.title || ''}`}
        size="xl"
      >
        {viewHomework?.submissions?.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Student</Th>
                <Th className="hidden sm:table-cell">Submitted At</Th>
                <Th className="hidden md:table-cell">Content</Th>
                <Th>Grade</Th>
                <Th>Feedback</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {viewHomework?.submissions?.map((submission, index) => {
                const studentId =
                  typeof submission.studentId === 'object'
                    ? submission.studentId._id
                    : submission.studentId;
                const isGrading = gradingStudent === studentId;

                return (
                  <Tr key={index}>
                    <Td>
                      <span className="font-medium text-gray-900">
                        {getStudentName(submission.studentId)}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </Td>
                    <Td className="hidden md:table-cell">
                      <p className="truncate max-w-[150px]">{submission.content}</p>
                    </Td>
                    <Td>
                      {isGrading ? (
                        <Input
                          className="w-20"
                          placeholder="Grade"
                          {...registerGrade('grade')}
                        />
                      ) : (
                        submission.grade || '-'
                      )}
                    </Td>
                    <Td>
                      {isGrading ? (
                        <Textarea
                          placeholder="Feedback"
                          rows={2}
                          className="min-w-[120px]"
                          {...registerGrade('feedback')}
                        />
                      ) : (
                        <p className="truncate max-w-[150px]">
                          {submission.feedback || '-'}
                        </p>
                      )}
                    </Td>
                    <Td>
                      {isGrading ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="xs"
                            loading={gradeMutation.isPending}
                            onClick={handleGradeSubmit(onGradeSubmit)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setGradingStudent(null);
                              resetGrade();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline-brand"
                          size="xs"
                          onClick={() => setGradingStudent(studentId)}
                        >
                          Grade
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Sheet>
    </div>
  );
};

export default Homework;
