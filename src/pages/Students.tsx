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
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  Avatar,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  useToast,
  Text,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiEdit2, FiEye } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studentsApi } from '../services/api';
import { Student } from '../types';
import { StudentForm } from '../components/students/StudentForm';
import { StudentDetailModal } from '../components/students/StudentDetailModal';

export const Students = () => {
  const [search, setSearch] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const toast = useToast();
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
      onClose();
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
    onDetailOpen();
  };

  const onSubmit = (data: any) => createMutation.mutate(data);

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
        <Heading size="lg">Students</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Add Student
        </Button>
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <InputGroup mb={4} maxW="300px">
          <InputLeftElement>
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Student</Th>
              <Th>Student ID</Th>
              <Th>Class</Th>
              <Th>Gender</Th>
              <Th>Blood Group</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredStudents && filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Tr key={student._id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={`${student.firstName} ${student.lastName}`} />
                      <Box>
                        <Text fontWeight="medium">{student.firstName} {student.lastName}</Text>
                        <Text fontSize="sm" color="gray.500">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}</Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>{student.studentId}</Td>
                  <Td>{student.class || '-'}</Td>
                  <Td>{student.gender || '-'}</Td>
                  <Td>
                    {student.bloodGroup ? (
                      <Badge colorScheme="red">{student.bloodGroup}</Badge>
                    ) : (
                      <Text color="gray.400">-</Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={student.status === 'active' ? 'green' : 'gray'}>
                      {student.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        leftIcon={<FiEye />}
                        onClick={() => handleViewStudent(student._id)}
                      >
                        View
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No students found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Add New Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <StudentForm
              onSubmit={onSubmit}
              isLoading={createMutation.isPending}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Detail/Edit Modal */}
      <StudentDetailModal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        studentId={selectedStudentId}
      />
    </Box>
  );
};
