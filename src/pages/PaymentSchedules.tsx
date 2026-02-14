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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  totalPaid: number;
  totalDue: number;
  installments: Installment[];
  isFullyPaid: boolean;
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm();
  const { register: registerPay, handleSubmit: handlePaySubmit, reset: resetPay } = useForm();

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

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => paymentSchedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      toast({ title: 'Payment schedule created', status: 'success' });
      onClose();
      reset();
    },
    onError: () => {
      toast({ title: 'Failed to create schedule', status: 'error' });
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

  const onCreateSubmit = (data: any) => {
    const student = students?.find((s: any) => s._id === data.studentId);
    createMutation.mutate({
      ...data,
      parentId: student?.parentId?._id || student?.parentId,
      totalAmount: Number(data.totalAmount),
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
        <Button colorScheme="brand" onClick={onOpen}>
          Create Schedule
        </Button>
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
                <HStack justify="space-between">
                  <Text>Paid: ₹{selectedSchedule.totalPaid.toLocaleString()}</Text>
                  <Text>Due: ₹{selectedSchedule.totalDue.toLocaleString()}</Text>
                  <Text>Total: ₹{selectedSchedule.totalAmount.toLocaleString()}</Text>
                </HStack>

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
              <Button onClick={() => setSelectedSchedule(null)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

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
                  <FormLabel>Student</FormLabel>
                  <Select {...register('studentId')} placeholder="Select student">
                    {students?.map((s: any) => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} {s.lastName} ({s.studentId}) - {s.class}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Academic Year</FormLabel>
                  <Input {...register('academicYear')} placeholder="2024-25" />
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
    </Box>
  );
};
