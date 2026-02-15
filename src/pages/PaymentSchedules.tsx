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
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Select as SearchableSelect } from 'chakra-react-select';
import { paymentSchedulesApi, studentsApi } from '../services/api';

interface Installment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  paidDate?: string;
  transactionId?: string;
}

interface PaymentSchedule {
  _id: string;
  studentId: { _id: string; studentId: string; firstName: string; lastName: string; class: string };
  parentId: { _id: string; firstName: string; lastName: string; email: string; phone: string };
  academicYear: string;
  planType: string;
  totalAmount: number;
  advancePayment: number;
  paidOnAdmission: number;
  totalPaid: number;
  totalDue: number;
  installments: Installment[];
  isFullyPaid: boolean;
  notes?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'yellow',
  paid: 'green',
  overdue: 'red',
  partially_paid: 'orange',
};

const planTypeLabels: Record<string, string> = {
  single: 'Single Payment',
  quarterly: 'Quarterly (4 installments)',
  monthly: 'Monthly (12 installments)',
};

export const PaymentSchedules = () => {
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [editSchedule, setEditSchedule] = useState<PaymentSchedule | null>(null);
  const [editInstallments, setEditInstallments] = useState<Installment[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isAdvanceOpen, onOpen: onAdvanceOpen, onClose: onAdvanceClose } = useDisclosure();
  const [advancePayments, setAdvancePayments] = useState<Record<string, { advance: number; admission: number }>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, control } = useForm();
  const { register: registerPay, handleSubmit: handlePaySubmit, reset: resetPay } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm();
  const { register: registerAdvance, handleSubmit: handleAdvanceSubmit, reset: resetAdvance, watch: watchAdvance, control: controlAdvance } = useForm();

  const selectedStudentId = watch('studentId');

  const getAcademicYear = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    }
    return `${year - 1}-${year.toString().slice(-2)}`;
  };

  const { data: schedules, isLoading } = useQuery<PaymentSchedule[]>({
    queryKey: ['payment-schedules'],
    queryFn: async () => {
      const res = await paymentSchedulesApi.getAll();
      return res.data;
    },
  });

  const { data: overdueData } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: async () => {
      const res = await paymentSchedulesApi.getOverdue();
      return res.data;
    },
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students-for-schedule'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      console.log('Students loaded:', res.data);
      return res.data;
    },
  });

  console.log('Students state:', { students, studentsLoading, studentsError });

  useEffect(() => {
    if (selectedStudentId && students) {
      const student = students.find((s: any) => s._id === selectedStudentId);
      if (student?.admissionDate) {
        setValue('academicYear', getAcademicYear(student.admissionDate));
      }
    }
  }, [selectedStudentId, students, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: any) => paymentSchedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      toast({ title: 'Payment schedule created', status: 'success' });
      onClose();
      reset();
    },
    onError: (error: any) => {
      console.error('Create schedule error:', error);
      toast({ 
        title: 'Failed to create schedule', 
        description: error?.response?.data?.message || error.message,
        status: 'error' 
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentSchedulesApi.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-payments'] });
      toast({ title: 'Payment recorded', status: 'success' });
      onPayClose();
      resetPay();
    },
    onError: () => {
      toast({ title: 'Failed to record payment', status: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => paymentSchedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      toast({ title: 'Schedule updated', status: 'success' });
      onEditClose();
      setEditSchedule(null);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update schedule', 
        description: error?.response?.data?.message || error.message,
        status: 'error' 
      });
    },
  });

  const onCreateSubmit = (data: any) => {
    const student = students?.find((s: any) => s._id === data.studentId);
    
    if (!student) {
      toast({ title: 'Please select a student', status: 'warning' });
      return;
    }
    
    const parentId = student?.parentId?._id || student?.parentId;
    
    if (!parentId) {
      toast({ title: 'Student has no parent linked', status: 'error' });
      return;
    }
    
    console.log('Creating schedule with:', { studentId: data.studentId, parentId, student });
    
    const studentAdvance = advancePayments[data.studentId] || { advance: 0, admission: 0 };
    
    createMutation.mutate({
      ...data,
      parentId,
      totalAmount: Number(data.totalAmount),
      advancePayment: studentAdvance.advance,
      paidOnAdmission: studentAdvance.admission,
    });
  };

  const onPaySubmit = (data: any) => {
    recordPaymentMutation.mutate({
      scheduleId: selectedSchedule?._id,
      installmentNumber: selectedInstallment?.installmentNumber,
      amount: Number(data.amount),
      transactionId: data.transactionId,
      paymentMethod: data.paymentMethod,
      remarks: data.remarks,
    });
  };

  const openPayModal = (schedule: PaymentSchedule, installment: Installment) => {
    setSelectedSchedule(schedule);
    setSelectedInstallment(installment);
    onPayOpen();
  };

  const openEditModal = (schedule: PaymentSchedule) => {
    setEditSchedule(schedule);
    setEditInstallments([...schedule.installments]);
    setEditValue('totalAmount', schedule.totalAmount);
    setEditValue('advancePayment', schedule.advancePayment || 0);
    setEditValue('paidOnAdmission', schedule.paidOnAdmission || 0);
    setEditValue('notes', schedule.notes || '');
    onEditOpen();
  };

  const updateInstallment = (index: number, field: 'amount' | 'dueDate', value: any) => {
    const updated = [...editInstallments];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Number(value) };
    } else {
      updated[index] = { ...updated[index], dueDate: value };
    }
    setEditInstallments(updated);
  };

  const onEditSubmit = (data: any) => {
    if (!editSchedule) return;
    
    const installmentsData = editInstallments.map(inst => ({
      installmentNumber: inst.installmentNumber,
      amount: inst.amount,
      dueDate: typeof inst.dueDate === 'string' ? inst.dueDate : new Date(inst.dueDate).toISOString().split('T')[0],
    }));

    updateMutation.mutate({
      id: editSchedule._id,
      data: {
        totalAmount: Number(data.totalAmount),
        advancePayment: Number(data.advancePayment) || 0,
        paidOnAdmission: Number(data.paidOnAdmission) || 0,
        notes: data.notes,
        installments: installmentsData,
      },
    });
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  const totalCollected = schedules?.reduce((sum, s) => sum + s.totalPaid, 0) || 0;
  const totalPending = schedules?.reduce((sum, s) => sum + s.totalDue, 0) || 0;
  const overdueCount = overdueData?.length || 0;

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Payment Schedules</Heading>
        <HStack>
          <Button colorScheme="blue" onClick={onAdvanceOpen}>
            Advance Payment
          </Button>
          <Button colorScheme="brand" onClick={onOpen}>
            Create Schedule
          </Button>
        </HStack>
      </HStack>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Collected</StatLabel>
              <StatNumber color="green.500">₹{totalCollected.toLocaleString()}</StatNumber>
              <StatHelpText>This academic year</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Pending</StatLabel>
              <StatNumber color="orange.500">₹{totalPending.toLocaleString()}</StatNumber>
              <StatHelpText>Outstanding amount</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Overdue Payments</StatLabel>
              <StatNumber color="red.500">{overdueCount}</StatNumber>
              <StatHelpText>Require attention</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs colorScheme="brand">
        <TabList>
          <Tab>All Schedules</Tab>
          <Tab>Overdue ({overdueCount})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Class</Th>
                    <Th>Plan Type</Th>
                    <Th>Total Amount</Th>
                    <Th>Paid</Th>
                    <Th>Progress</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {schedules?.map((schedule) => (
                    <Tr key={schedule._id}>
                      <Td>
                        <Text fontWeight="medium">
                          {schedule.studentId?.firstName} {schedule.studentId?.lastName}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {schedule.studentId?.studentId}
                        </Text>
                      </Td>
                      <Td>{schedule.studentId?.class}</Td>
                      <Td>{planTypeLabels[schedule.planType]}</Td>
                      <Td>₹{schedule.totalAmount.toLocaleString()}</Td>
                      <Td>₹{schedule.totalPaid.toLocaleString()}</Td>
                      <Td w="150px">
                        <Progress
                          value={(schedule.totalPaid / schedule.totalAmount) * 100}
                          colorScheme={schedule.isFullyPaid ? 'green' : 'brand'}
                          borderRadius="full"
                          size="sm"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {Math.round((schedule.totalPaid / schedule.totalAmount) * 100)}%
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={schedule.isFullyPaid ? 'green' : 'yellow'}>
                          {schedule.isFullyPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>

          <TabPanel px={0}>
            <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Parent Contact</Th>
                    <Th>Installment</Th>
                    <Th>Amount Due</Th>
                    <Th>Due Date</Th>
                    <Th>Days Overdue</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {overdueData?.map((item: any, idx: number) => (
                    <Tr key={idx}>
                      <Td>
                        {item.schedule.studentId?.firstName} {item.schedule.studentId?.lastName}
                      </Td>
                      <Td>
                        <Text fontSize="sm">{item.schedule.parentId?.phone}</Text>
                        <Text fontSize="xs" color="gray.500">{item.schedule.parentId?.email}</Text>
                      </Td>
                      <Td>#{item.installment.installmentNumber}</Td>
                      <Td>₹{(item.installment.amount - item.installment.paidAmount).toLocaleString()}</Td>
                      <Td>{new Date(item.installment.dueDate).toLocaleDateString()}</Td>
                      <Td>
                        <Badge colorScheme="red">{item.daysOverdue} days</Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => openPayModal(item.schedule, item.installment)}
                        >
                          Record Payment
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Schedule Details Modal */}
      {selectedSchedule && !isPayOpen && (
        <Modal isOpen={!!selectedSchedule} onClose={() => setSelectedSchedule(null)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Payment Schedule - {selectedSchedule.studentId?.firstName} {selectedSchedule.studentId?.lastName}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text>Academic Year: <strong>{selectedSchedule.academicYear}</strong></Text>
                  <Text>Plan: <strong>{planTypeLabels[selectedSchedule.planType]}</strong></Text>
                </HStack>
                <Progress
                  value={(selectedSchedule.totalPaid / selectedSchedule.totalAmount) * 100}
                  colorScheme="green"
                  borderRadius="full"
                />
                <SimpleGrid columns={2} spacing={2}>
                  <Text>Total Amount: <strong>₹{selectedSchedule.totalAmount.toLocaleString()}</strong></Text>
                  <Text>Advance Payment: <strong>₹{(selectedSchedule.advancePayment || 0).toLocaleString()}</strong></Text>
                  <Text>Paid on Admission: <strong>₹{(selectedSchedule.paidOnAdmission || 0).toLocaleString()}</strong></Text>
                  <Text>Total Paid: <strong>₹{selectedSchedule.totalPaid.toLocaleString()}</strong></Text>
                  <Text color="orange.500">Due: <strong>₹{selectedSchedule.totalDue.toLocaleString()}</strong></Text>
                </SimpleGrid>

                <Heading size="sm" mt={4}>Installments</Heading>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>#</Th>
                      <Th>Amount</Th>
                      <Th>Due Date</Th>
                      <Th>Status</Th>
                      <Th>Paid</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedSchedule.installments.map((inst) => (
                      <Tr key={inst.installmentNumber}>
                        <Td>{inst.installmentNumber}</Td>
                        <Td>₹{inst.amount.toLocaleString()}</Td>
                        <Td>{new Date(inst.dueDate).toLocaleDateString()}</Td>
                        <Td>
                          <Badge colorScheme={statusColors[inst.status]}>{inst.status}</Badge>
                        </Td>
                        <Td>₹{inst.paidAmount.toLocaleString()}</Td>
                        <Td>
                          {inst.status !== 'paid' && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => openPayModal(selectedSchedule, inst)}
                            >
                              Pay
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="brand" 
                mr={3} 
                onClick={() => {
                  openEditModal(selectedSchedule);
                  setSelectedSchedule(null);
                }}
              >
                Edit Schedule
              </Button>
              <Button onClick={() => setSelectedSchedule(null)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Edit Schedule Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit Payment Schedule - {editSchedule?.studentId?.firstName} {editSchedule?.studentId?.lastName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleEditSubmit(onEditSubmit)}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Total Amount (₹)</FormLabel>
                    <Input type="number" {...registerEdit('totalAmount')} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Advance Payment (₹)</FormLabel>
                    <Input type="number" {...registerEdit('advancePayment')} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Paid on Admission (₹)</FormLabel>
                    <Input type="number" {...registerEdit('paidOnAdmission')} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Input {...registerEdit('notes')} />
                  </FormControl>
                </SimpleGrid>

                <Heading size="sm" mt={4}>Installments (Edit Amounts & Due Dates)</Heading>
                <Box maxH="300px" overflowY="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>Amount (₹)</Th>
                        <Th>Due Date</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {editInstallments.map((inst, idx) => (
                        <Tr key={inst.installmentNumber}>
                          <Td>{inst.installmentNumber}</Td>
                          <Td>
                            <Input
                              size="sm"
                              type="number"
                              value={inst.amount}
                              onChange={(e) => updateInstallment(idx, 'amount', e.target.value)}
                              isDisabled={inst.status === 'paid'}
                            />
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              type="date"
                              value={new Date(inst.dueDate).toISOString().split('T')[0]}
                              onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)}
                              isDisabled={inst.status === 'paid'}
                            />
                          </Td>
                          <Td>
                            <Badge colorScheme={statusColors[inst.status]} size="sm">
                              {inst.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Button type="submit" colorScheme="brand" isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Payment Schedule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onCreateSubmit)}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Student {studentsLoading && '(Loading...)'}</FormLabel>
                  <Controller
                    name="studentId"
                    control={control}
                    rules={{ required: 'Student is required' }}
                    render={({ field }) => (
                      <SearchableSelect
                        {...field}
                        placeholder="Search and select student..."
                        isLoading={studentsLoading}
                        options={students?.map((s: any) => ({
                          value: s._id,
                          label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
                        })) || []}
                        onChange={(option: any) => field.onChange(option?.value)}
                        value={students?.map((s: any) => ({
                          value: s._id,
                          label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
                        })).find((opt: any) => opt.value === field.value)}
                      />
                    )}
                  />
                  {students?.length === 0 && (
                    <Text fontSize="sm" color="red.500">No students found. Approve an admission first.</Text>
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Academic Year</FormLabel>
                  <Input {...register('academicYear')} placeholder="Select student first" isReadOnly bg="gray.100" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Payment Plan</FormLabel>
                  <Select {...register('planType')} placeholder="Select plan">
                    <option value="single">Single Payment</option>
                    <option value="quarterly">Quarterly (4 installments)</option>
                    <option value="monthly">Monthly (12 installments)</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Total Amount (₹)</FormLabel>
                  <Input type="number" {...register('totalAmount')} placeholder="50000" />
                </FormControl>
                {selectedStudentId && advancePayments[selectedStudentId] && (
                  <Box p={3} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                    <Text fontWeight="medium" color="green.700">Pre-collected Payments for this Student:</Text>
                    <HStack mt={2} spacing={6}>
                      <Text>Advance: <strong>₹{advancePayments[selectedStudentId]?.advance?.toLocaleString() || 0}</strong></Text>
                      <Text>Admission Fee: <strong>₹{advancePayments[selectedStudentId]?.admission?.toLocaleString() || 0}</strong></Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mt={1}>These amounts will be deducted from the schedule.</Text>
                  </Box>
                )}
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Input {...register('notes')} placeholder="Optional notes" />
                </FormControl>
                <Button type="submit" colorScheme="brand" w="100%" isLoading={createMutation.isPending}>
                  Create Schedule
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPayOpen} onClose={onPayClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Record Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Installment #{selectedInstallment?.installmentNumber} - 
              Due: ₹{((selectedInstallment?.amount || 0) - (selectedInstallment?.paidAmount || 0)).toLocaleString()}
            </Text>
            <form onSubmit={handlePaySubmit(onPaySubmit)}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Amount (₹)</FormLabel>
                  <Input
                    type="number"
                    {...registerPay('amount')}
                    defaultValue={(selectedInstallment?.amount || 0) - (selectedInstallment?.paidAmount || 0)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Transaction ID</FormLabel>
                  <Input {...registerPay('transactionId')} placeholder="TXN123456" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Payment Method</FormLabel>
                  <Select {...registerPay('paymentMethod')} placeholder="Select method">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Remarks</FormLabel>
                  <Input {...registerPay('remarks')} placeholder="Optional" />
                </FormControl>
                <Button type="submit" colorScheme="green" w="100%" isLoading={recordPaymentMutation.isPending}>
                  Record Payment
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Advance Payment Modal */}
      <Modal isOpen={isAdvanceOpen} onClose={onAdvanceClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Collect Advance / Admission Fee</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleAdvanceSubmit((data: any) => {
              if (!data.studentId) {
                toast({ title: 'Please select a student', status: 'warning' });
                return;
              }
              const totalAmount = (Number(data.advanceAmount) || 0) + (Number(data.admissionAmount) || 0);
              if (totalAmount <= 0) {
                toast({ title: 'Enter at least one payment amount', status: 'warning' });
                return;
              }
              // TODO: Integrate payment gateway here
              toast({ 
                title: 'Payment Gateway', 
                description: `Ready to process ₹${totalAmount.toLocaleString()}. Gateway integration pending.`,
                status: 'info',
                duration: 5000,
              });
              // Store the advance payment locally for use when creating schedule
              setAdvancePayments(prev => ({
                ...prev,
                [data.studentId]: {
                  advance: Number(data.advanceAmount) || 0,
                  admission: Number(data.admissionAmount) || 0,
                }
              }));
              toast({ title: 'Advance payment recorded', description: 'This will be applied when creating the fee schedule.', status: 'success' });
              onAdvanceClose();
              resetAdvance();
            })}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Student</FormLabel>
                  <Controller
                    name="studentId"
                    control={controlAdvance}
                    rules={{ required: 'Student is required' }}
                    render={({ field }) => (
                      <SearchableSelect
                        {...field}
                        placeholder="Search and select student..."
                        isLoading={studentsLoading}
                        options={students?.map((s: any) => ({
                          value: s._id,
                          label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
                        })) || []}
                        onChange={(option: any) => field.onChange(option?.value)}
                        value={students?.map((s: any) => ({
                          value: s._id,
                          label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
                        })).find((opt: any) => opt.value === field.value)}
                      />
                    )}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel>Advance Payment (₹)</FormLabel>
                    <Input type="number" {...registerAdvance('advanceAmount')} placeholder="0" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Admission Fee (₹)</FormLabel>
                    <Input type="number" {...registerAdvance('admissionAmount')} placeholder="0" />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Payment Method</FormLabel>
                  <Select {...registerAdvance('paymentMethod')} placeholder="Select method">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </FormControl>
                <Box w="100%" p={3} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.700">
                    Total: <strong>₹{((Number(watchAdvance('advanceAmount')) || 0) + (Number(watchAdvance('admissionAmount')) || 0)).toLocaleString()}</strong>
                  </Text>
                </Box>
                <Button type="submit" colorScheme="blue" w="100%">
                  Pay Now
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
