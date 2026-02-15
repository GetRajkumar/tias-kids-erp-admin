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
  Spinner,
  Center,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiTrash2, FiEdit2, FiEye } from 'react-icons/fi';
import { homeworkApi } from '../services/api';
import { Homework as HomeworkType } from '../types';

const subjectColors: Record<string, string> = {
  English: 'blue',
  Math: 'purple',
  Science: 'green',
  Art: 'pink',
  Music: 'orange',
  General: 'gray',
  Hindi: 'yellow',
  EVS: 'teal',
};

const classes = [
  'Playgroup',
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
];

const subjects = ['English', 'Math', 'Science', 'Art', 'Music', 'General', 'Hindi', 'EVS'];

const Homework = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editHomework, setEditHomework] = useState<HomeworkType | null>(null);
  const [viewHomework, setViewHomework] = useState<HomeworkType | null>(null);
  const [gradingStudent, setGradingStudent] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const toast = useToast();
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
    onClose();
  };

  const handleViewClose = () => {
    setViewHomework(null);
    setGradingStudent(null);
    resetGrade();
    onViewClose();
  };

  const openEditModal = (homework: HomeworkType) => {
    setEditHomework(homework);
    setValue('title', homework.title);
    setValue('description', homework.description);
    setValue('subject', homework.subject);
    setValue('targetClass', homework.targetClass);
    setValue('dueDate', homework.dueDate.split('T')[0]);
    setValue('isActive', homework.isActive);
    onOpen();
  };

  const openViewModal = (homework: HomeworkType) => {
    setViewHomework(homework);
    onViewOpen();
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
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Homework Management</Heading>
        <Button colorScheme="brand" onClick={onOpen}>
          Create Homework
        </Button>
      </HStack>

      <Box mb={4}>
        <Select
          placeholder="Filter by class"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          maxW="300px"
        >
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </Select>
      </Box>

      {!selectedClass ? (
        <Center h="200px">
          <Text color="gray.500">Select a class to view homework assignments</Text>
        </Center>
      ) : (
        <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Subject</Th>
                <Th>Class</Th>
                <Th>Due Date</Th>
                <Th>Submissions</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {homeworkList?.map((homework) => (
                <Tr key={homework._id}>
                  <Td>
                    <Text fontWeight="medium">{homework.title}</Text>
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                      {homework.description}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={subjectColors[homework.subject] || 'gray'}>
                      {homework.subject}
                    </Badge>
                  </Td>
                  <Td>{homework.targetClass}</Td>
                  <Td>{new Date(homework.dueDate).toLocaleDateString()}</Td>
                  <Td>{homework.submissions?.length || 0}</Td>
                  <Td>
                    <Badge colorScheme={homework.isActive ? 'green' : 'gray'}>
                      {homework.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack>
                      <IconButton
                        aria-label="View submissions"
                        icon={<FiEye />}
                        size="sm"
                        onClick={() => openViewModal(homework)}
                      />
                      <IconButton
                        aria-label="Edit"
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => openEditModal(homework)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this homework?')) {
                            deleteMutation.mutate(homework._id);
                          }
                        }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {homeworkList?.length === 0 && (
                <Tr>
                  <Td colSpan={7}>
                    <Center py={4}>
                      <Text color="gray.500">No homework assignments found</Text>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editHomework ? 'Edit Homework' : 'Create Homework'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input {...register('title')} placeholder="Homework title" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea {...register('description')} placeholder="Homework description" rows={4} />
                </FormControl>

                <HStack w="100%" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Subject</FormLabel>
                    <Select {...register('subject')} defaultValue="">
                      <option value="" disabled>
                        Select subject
                      </option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Target Class</FormLabel>
                    <Select {...register('targetClass')} defaultValue="">
                      <option value="" disabled>
                        Select class
                      </option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Due Date</FormLabel>
                  <Input type="date" {...register('dueDate')} />
                </FormControl>

                {editHomework && (
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select {...register('isActive')} defaultValue="true">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </FormControl>
                )}

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="100%"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editHomework ? 'Update' : 'Create'} Homework
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* View Submissions Modal */}
      <Modal isOpen={isViewOpen} onClose={handleViewClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            Submissions - {viewHomework?.title}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {viewHomework?.submissions?.length === 0 ? (
              <Center py={8}>
                <Text color="gray.500">No submissions yet</Text>
              </Center>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Submitted At</Th>
                    <Th>Content</Th>
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
                          <Text fontWeight="medium">
                            {getStudentName(submission.studentId)}
                          </Text>
                        </Td>
                        <Td>{new Date(submission.submittedAt).toLocaleString()}</Td>
                        <Td>
                          <Text noOfLines={2}>{submission.content}</Text>
                        </Td>
                        <Td>
                          {isGrading ? (
                            <Input
                              size="sm"
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
                              size="sm"
                              placeholder="Feedback"
                              rows={2}
                              {...registerGrade('feedback')}
                            />
                          ) : (
                            <Text noOfLines={2}>{submission.feedback || '-'}</Text>
                          )}
                        </Td>
                        <Td>
                          {isGrading ? (
                            <HStack>
                              <Button
                                size="xs"
                                colorScheme="brand"
                                onClick={handleGradeSubmit(onGradeSubmit)}
                                isLoading={gradeMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="xs"
                                onClick={() => {
                                  setGradingStudent(null);
                                  resetGrade();
                                }}
                              >
                                Cancel
                              </Button>
                            </HStack>
                          ) : (
                            <Button
                              size="xs"
                              colorScheme="brand"
                              variant="outline"
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Homework;
