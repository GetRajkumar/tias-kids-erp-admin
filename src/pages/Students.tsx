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
  FormControl,
  FormLabel,
  Select,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { studentsApi } from '../services/api';
import { Student } from '../types';

export const Students = () => {
  const [search, setSearch] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      return res.data;
    },
  });

  const { register, handleSubmit, reset } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Student created', status: 'success' });
      onClose();
      reset();
    },
    onError: () => {
      toast({ title: 'Failed to create student', status: 'error' });
    },
  });

  const filteredStudents = students?.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
  );

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
        <Button leftIcon={<FiPlus />} onClick={onOpen}>
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
          <Thead>
            <Tr>
              <Th>Student</Th>
              <Th>Student ID</Th>
              <Th>Class</Th>
              <Th>Gender</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredStudents?.map((student) => (
              <Tr key={student._id}>
                <Td>
                  <HStack>
                    <Avatar size="sm" name={`${student.firstName} ${student.lastName}`} />
                    <Box>
                      {student.firstName} {student.lastName}
                    </Box>
                  </HStack>
                </Td>
                <Td>{student.studentId}</Td>
                <Td>{student.class || '-'}</Td>
                <Td>{student.gender || '-'}</Td>
                <Td>
                  <Badge colorScheme={student.status === 'active' ? 'green' : 'gray'}>
                    {student.status}
                  </Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <HStack w="100%">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input {...register('firstName')} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input {...register('lastName')} />
                  </FormControl>
                </HStack>
                <FormControl isRequired>
                  <FormLabel>Date of Birth</FormLabel>
                  <Input type="date" {...register('dateOfBirth')} />
                </FormControl>
                <HStack w="100%">
                  <FormControl>
                    <FormLabel>Gender</FormLabel>
                    <Select {...register('gender')}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Class</FormLabel>
                    <Select {...register('class')}>
                      <option value="">Select</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                    </Select>
                  </FormControl>
                </HStack>
                <Button type="submit" w="100%" isLoading={createMutation.isPending}>
                  Create Student
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
