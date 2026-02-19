import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye } from 'lucide-react';
import { studentsApi } from '../services/api';
import { Student } from '../types';
import { StudentForm } from '../components/students/StudentForm';
import { StudentDetailModal } from '../components/students/StudentDetailModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { LoadingPage } from '../components/ui/Spinner';
import { toast } from '../components/ui/toast';

export const Students = () => {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Student created successfully', status: 'success' });
      setCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create student',
        description: error.response?.data?.message || 'Unknown error',
        status: 'error',
      });
    },
  });

  const filteredStudents = students?.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewStudent = (id: string) => {
    setSelectedStudentId(id);
    setDetailOpen(true);
  };

  const onSubmit = (data: any) => createMutation.mutate(data);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
          Add Student
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="max-w-sm">
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Student</Th>
              <Th>Student ID</Th>
              <Th className="hidden md:table-cell">Class</Th>
              <Th className="hidden lg:table-cell">Gender</Th>
              <Th className="hidden lg:table-cell">Blood Group</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredStudents && filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Tr key={student._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" name={`${student.firstName} ${student.lastName}`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.dateOfBirth
                            ? new Date(student.dateOfBirth).toLocaleDateString()
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>{student.studentId}</Td>
                  <Td className="hidden md:table-cell">{student.class || '-'}</Td>
                  <Td className="hidden lg:table-cell">{student.gender || '-'}</Td>
                  <Td className="hidden lg:table-cell">
                    {student.bloodGroup ? (
                      <Badge color="red">{student.bloodGroup}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Td>
                  <Td>
                    <Badge color={student.status === 'active' ? 'green' : 'gray'}>
                      {student.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => handleViewStudent(student._id)}
                    >
                      View
                    </Button>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">No students found</p>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </div>

      {/* Create Student Sheet */}
      <Sheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        side="right"
        size="lg"
        title="Add New Student"
      >
        <StudentForm
          onSubmit={onSubmit}
          isLoading={createMutation.isPending}
        />
      </Sheet>

      {/* Student Detail Sheet */}
      <StudentDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        studentId={selectedStudentId}
      />
    </div>
  );
};
