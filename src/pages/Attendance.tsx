import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  Input,
  Spinner,
  Center,
  useToast,
  Select,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { attendanceApi, studentsApi } from '../services/api';
import { Attendance as AttendanceType, Student } from '../types';

const statusColors: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'yellow',
  excused: 'blue',
};

export const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const toast = useToast();
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
    mutationFn: (data: any) => attendanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Attendance marked', status: 'success' });
    },
  });

  const handleMark = (studentId: string, status: string) => {
    markMutation.mutate({ studentId, date, status });
  };

  const getStudentAttendance = (studentId: string) => {
    return attendance?.find((a) => a.studentId?._id === studentId);
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Attendance</Heading>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} maxW="200px" />
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Student ID</Th>
              <Th>Student Name</Th>
              <Th>Class</Th>
              <Th>Status</Th>
              <Th>Mark Attendance</Th>
            </Tr>
          </Thead>
          <Tbody>
            {students?.map((student) => {
              const att = getStudentAttendance(student._id);
              return (
                <Tr key={student._id}>
                  <Td>{student.studentId}</Td>
                  <Td>
                    {student.firstName} {student.lastName}
                  </Td>
                  <Td>{student.class || '-'}</Td>
                  <Td>
                    {att ? (
                      <Badge colorScheme={statusColors[att.status]}>{att.status}</Badge>
                    ) : (
                      <Badge colorScheme="gray">Not Marked</Badge>
                    )}
                  </Td>
                  <Td>
                    {!att && (
                      <Select
                        size="sm"
                        placeholder="Select"
                        maxW="120px"
                        onChange={(e) => handleMark(student._id, e.target.value)}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </Select>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
