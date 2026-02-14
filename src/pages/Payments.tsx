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
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { paymentsApi } from '../services/api';
import { Payment } from '../types';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  completed: 'green',
  failed: 'red',
  refunded: 'gray',
};

export const Payments = () => {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', filter],
    queryFn: async () => {
      const res = await paymentsApi.getAll(filter || undefined);
      return res.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, transactionId, paymentMethod }: any) =>
      paymentsApi.markComplete(id, transactionId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Payment marked as completed', status: 'success' });
      onClose();
      setTransactionId('');
      setPaymentMethod('');
    },
  });

  const handleComplete = () => {
    if (selected && transactionId && paymentMethod) {
      completeMutation.mutate({ id: selected._id, transactionId, paymentMethod });
    }
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
        <Heading size="lg">Payments</Heading>
        <Select maxW="200px" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Select>
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Student</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {payments?.map((payment) => (
              <Tr key={payment._id}>
                <Td>
                  {payment.studentId?.firstName} {payment.studentId?.lastName}
                </Td>
                <Td>{payment.type.replace('_', ' ')}</Td>
                <Td>${payment.amount.toLocaleString()}</Td>
                <Td>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}</Td>
                <Td>
                  <Badge colorScheme={statusColors[payment.status]}>{payment.status}</Badge>
                </Td>
                <Td>
                  {payment.status === 'pending' && (
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => {
                        setSelected(payment);
                        onOpen();
                      }}
                    >
                      Mark Paid
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mark Payment Complete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Transaction ID</FormLabel>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Select method"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleComplete}
              isLoading={completeMutation.isPending}
              isDisabled={!transactionId || !paymentMethod}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
