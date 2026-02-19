import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceApi, studentsApi } from '../services/api';
import { Attendance as AttendanceType, Student } from '../types';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { LoadingPage } from '../components/ui/Spinner';

const statusColors: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'yellow',
  excused: 'blue',
};

export const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: attendance, isLoading } = useQuery<AttendanceType[]>({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const res = await attendanceApi.getAll({ date });
      return res.data;
    },
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      return res.data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (data: { studentId: string; date: string; status: string }) => attendanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Attendance marked', status: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to mark attendance', status: 'error' });
    },
  });

  const handleMark = (studentId: string, status: string) => {
    markMutation.mutate({ studentId, date, status });
  };

  const getStudentAttendance = (studentId: string) => {
    return attendance?.find((a) => a.studentId?._id === studentId);
  };

  const navigateDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Count stats
  const stats = {
    total: students?.length || 0,
    marked: students?.filter((s) => getStudentAttendance(s._id)).length || 0,
    present: attendance?.filter((a) => a.status === 'present').length || 0,
    absent: attendance?.filter((a) => a.status === 'absent').length || 0,
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)} icon={<ChevronLeft className="h-4 w-4" />} />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40 text-center"
          />
          <Button variant="ghost" size="sm" onClick={() => navigateDate(1)} icon={<ChevronRight className="h-4 w-4" />} />
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          <span className="text-xs text-gray-500">Total Students</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl font-bold text-blue-600">{stats.marked}</span>
          <span className="text-xs text-gray-500">Marked</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl font-bold text-green-600">{stats.present}</span>
          <span className="text-xs text-gray-500">Present</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
          <span className="text-xs text-gray-500">Absent</span>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card padding={false}>
        <Table>
          <Thead>
            <Tr>
              <Th>Student ID</Th>
              <Th>Student Name</Th>
              <Th className="hidden md:table-cell">Class</Th>
              <Th>Status</Th>
              <Th>Mark Attendance</Th>
            </Tr>
          </Thead>
          <Tbody>
            {students && students.length > 0 ? (
              students.map((student) => {
                const att = getStudentAttendance(student._id);
                return (
                  <Tr key={student._id}>
                    <Td>
                      <span className="font-mono text-xs text-gray-500">{student.studentId}</span>
                    </Td>
                    <Td>
                      <span className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">{student.class || '-'}</Td>
                    <Td>
                      {att ? (
                        <Badge color={statusColors[att.status]}>{att.status}</Badge>
                      ) : (
                        <Badge color="gray">Not Marked</Badge>
                      )}
                    </Td>
                    <Td>
                      {!att ? (
                        <Select
                          className="w-28"
                          onChange={(e) => {
                            if (e.target.value) handleMark(student._id, e.target.value);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </Select>
                      ) : (
                        <span className="text-xs text-gray-400">Already marked</span>
                      )}
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={5} className="py-8 text-center text-gray-500">
                  No students found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
};
