import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Badge,
  Text,
  Heading,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Button,
  useToast,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Student } from '../../types';
import { studentsApi, usersApi } from '../../services/api';
import { StudentForm } from './StudentForm';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export const StudentDetailModal = ({ isOpen, onClose, studentId }: StudentDetailModalProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      if (!studentId) return undefined;
      const res = await studentsApi.getById(studentId);
      return res.data;
    },
    enabled: !!studentId && isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => studentsApi.update(studentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast({ title: 'Student updated successfully', status: 'success' });
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update student',
        description: error.response?.data?.message || 'Unknown error',
        status: 'error',
      });
    },
  });

  const handleUpdate = (data: any) => {
    updateMutation.mutate(data);
  };

  if (!studentId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          {isEditMode ? 'Edit Student' : 'Student Details'}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isLoading ? (
            <Center h="300px">
              <Spinner size="lg" color="blue.500" />
            </Center>
          ) : isEditMode ? (
            <StudentForm
              student={student}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              isEdit={true}
            />
          ) : (
            student && <StudentDetailView student={student} />
          )}
        </ModalBody>

        <ModalFooter>
          {!isEditMode && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button colorScheme="blue" onClick={() => setIsEditMode(true)}>
                Edit Student
              </Button>
            </HStack>
          )}
          {isEditMode && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const StudentDetailView = ({ student }: { student: Student }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isEditingParent, setIsEditingParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const parent = student.parentId as any;

  const updateParentMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(parent?._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student'] });
      toast({ title: 'Parent details updated', status: 'success' });
      setIsEditingParent(false);
    },
    onError: () => {
      toast({ title: 'Failed to update parent', status: 'error' });
    },
  });

  const startEditParent = () => {
    setParentForm({
      firstName: parent?.firstName || '',
      lastName: parent?.lastName || '',
      phone: parent?.phone || '',
    });
    setIsEditingParent(true);
  };

  const saveParent = () => {
    updateParentMutation.mutate(parentForm);
  };

  return (
    <Tabs>
      <TabList>
        <Tab>General</Tab>
        <Tab>Parent</Tab>
        <Tab>Medical</Tab>
        <Tab>Contact</Tab>
        <Tab>Address</Tab>
      </TabList>

      <TabPanels>
        {/* General Tab */}
        <TabPanel>
          <VStack spacing={4} align="start">
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Student ID
              </Text>
              <Text fontSize="lg">{student.studentId}</Text>
            </Box>
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Full Name
              </Text>
              <Text fontSize="lg">
                {student.firstName} {student.lastName}
              </Text>
            </Box>
            <HStack spacing={4} w="100%">
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Date of Birth
                </Text>
                <Text>{new Date(student.dateOfBirth).toLocaleDateString()}</Text>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Gender
                </Text>
                <Text>{student.gender || '-'}</Text>
              </Box>
            </HStack>
            <HStack spacing={4} w="100%">
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Blood Group
                </Text>
                <Badge colorScheme="red">{student.bloodGroup || '-'}</Badge>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Status
                </Text>
                <Badge colorScheme={student.status === 'active' ? 'green' : 'gray'}>
                  {student.status}
                </Badge>
              </Box>
            </HStack>
            <HStack spacing={4} w="100%">
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Class
                </Text>
                <Text>{student.class || '-'}</Text>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  Section
                </Text>
                <Text>{student.section || '-'}</Text>
              </Box>
            </HStack>
          </VStack>
        </TabPanel>

        {/* Parent Tab */}
        <TabPanel>
          <VStack spacing={4} align="start">
            <HStack justify="space-between" w="100%">
              <Heading size="sm">Parent/Guardian Details</Heading>
              {!isEditingParent && parent && (
                <Button size="sm" colorScheme="blue" onClick={startEditParent}>
                  Edit Parent
                </Button>
              )}
            </HStack>

            {!parent ? (
              <Text color="gray.500">No parent linked to this student</Text>
            ) : isEditingParent ? (
              <VStack spacing={4} w="100%">
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={parentForm.firstName}
                      onChange={(e) => setParentForm({ ...parentForm, firstName: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={parentForm.lastName}
                      onChange={(e) => setParentForm({ ...parentForm, lastName: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Email (not editable)</FormLabel>
                  <Input value={parent.email || ''} isDisabled />
                </FormControl>
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={parentForm.phone}
                    onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                  />
                </FormControl>
                <HStack>
                  <Button colorScheme="blue" onClick={saveParent} isLoading={updateParentMutation.isPending}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditingParent(false)}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <Box>
                    <Text fontWeight="bold" color="gray.500" mb={1}>First Name</Text>
                    <Text>{parent.firstName || '-'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.500" mb={1}>Last Name</Text>
                    <Text>{parent.lastName || '-'}</Text>
                  </Box>
                </SimpleGrid>
                <Box w="100%">
                  <Text fontWeight="bold" color="gray.500" mb={1}>Email</Text>
                  <Text>{parent.email || '-'}</Text>
                </Box>
                <Box w="100%">
                  <Text fontWeight="bold" color="gray.500" mb={1}>Phone</Text>
                  <Text>{parent.phone || '-'}</Text>
                </Box>
              </>
            )}
          </VStack>
        </TabPanel>

        {/* Medical Tab */}
        <TabPanel>
          <VStack spacing={5} align="start">
            {/* Allergies */}
            <Box w="100%">
              <Heading size="sm" mb={2}>
                Allergies
              </Heading>
              {student.medicalInfo?.allergies && student.medicalInfo.allergies.length > 0 ? (
                <HStack spacing={2} wrap="wrap">
                  {student.medicalInfo.allergies.map((allergy, idx) => (
                    <Badge key={idx} colorScheme="red">
                      {allergy}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Text color="gray.500">No allergies recorded</Text>
              )}
            </Box>

            <Divider />

            {/* Medical Conditions */}
            <Box w="100%">
              <Heading size="sm" mb={2}>
                Medical Conditions
              </Heading>
              {student.medicalInfo?.medicalConditions &&
              student.medicalInfo.medicalConditions.length > 0 ? (
                <HStack spacing={2} wrap="wrap">
                  {student.medicalInfo.medicalConditions.map((condition, idx) => (
                    <Badge key={idx} colorScheme="orange">
                      {condition}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Text color="gray.500">No medical conditions recorded</Text>
              )}
            </Box>

            <Divider />

            {/* Medications */}
            <Box w="100%">
              <Heading size="sm" mb={2}>
                Current Medications
              </Heading>
              {student.medicalInfo?.medications && student.medicalInfo.medications.length > 0 ? (
                <HStack spacing={2} wrap="wrap">
                  {student.medicalInfo.medications.map((medication, idx) => (
                    <Badge key={idx} colorScheme="green">
                      {medication}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Text color="gray.500">No medications recorded</Text>
              )}
            </Box>

            <Divider />

            {/* Special Needs */}
            <Box w="100%">
              <Heading size="sm" mb={2}>
                Special Needs / Notes
              </Heading>
              <Text whiteSpace="pre-wrap" color={student.medicalInfo?.specialNeeds ? 'black' : 'gray.500'}>
                {student.medicalInfo?.specialNeeds || 'No special needs recorded'}
              </Text>
            </Box>
          </VStack>
        </TabPanel>

        {/* Contact Tab */}
        <TabPanel>
          <VStack spacing={4} align="start">
            <Heading size="sm">Emergency Contact</Heading>
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Name
              </Text>
              <Text>{student.emergencyContact?.name || '-'}</Text>
            </Box>
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Relation
              </Text>
              <Text>{student.emergencyContact?.relation || '-'}</Text>
            </Box>
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Phone
              </Text>
              <Text>{student.emergencyContact?.phone || '-'}</Text>
            </Box>
          </VStack>
        </TabPanel>

        {/* Address Tab */}
        <TabPanel>
          <VStack spacing={4} align="start">
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Street
              </Text>
              <Text>{student.address?.street || '-'}</Text>
            </Box>
            <HStack spacing={4} w="100%">
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  City
                </Text>
                <Text>{student.address?.city || '-'}</Text>
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" color="gray.500" mb={1}>
                  State
                </Text>
                <Text>{student.address?.state || '-'}</Text>
              </Box>
            </HStack>
            <Box w="100%">
              <Text fontWeight="bold" color="gray.500" mb={1}>
                Zip Code
              </Text>
              <Text>{student.address?.zipCode || '-'}</Text>
            </Box>
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
