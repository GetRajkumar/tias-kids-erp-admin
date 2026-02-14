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
  useToast,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { admissionsApi } from '../services/api';
import { Admission } from '../types';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  under_review: 'blue',
  approved: 'green',
  rejected: 'red',
};

export const Admissions = () => {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Admission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions', filter],
    queryFn: async () => {
      const res = await admissionsApi.getAll(filter || undefined);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => admissionsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Admission approved', status: 'success' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      admissionsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({ title: 'Admission rejected', status: 'info' });
      onClose();
      setRejectReason('');
    },
  });

  const handleReject = () => {
    if (selected && rejectReason) {
      rejectMutation.mutate({ id: selected._id, reason: rejectReason });
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
        <Heading size="lg">Admissions</Heading>
        <Select maxW="200px" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Child Name</Th>
              <Th>Parent</Th>
              <Th>Contact</Th>
              <Th>Preferred Class</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {admissions?.map((admission) => (
              <Tr key={admission._id}>
                <Td>
                  {admission.childFirstName} {admission.childLastName}
                </Td>
                <Td>
                  {admission.parentFirstName} {admission.parentLastName}
                </Td>
                <Td>
                  <Text fontSize="sm">{admission.parentEmail}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {admission.parentPhone}
                  </Text>
                </Td>
                <Td>{admission.preferredClass || '-'}</Td>
                <Td>
                  <Badge colorScheme={statusColors[admission.status]}>{admission.status}</Badge>
                </Td>
                <Td>
                  {admission.status === 'pending' && (
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => approveMutation.mutate(admission._id)}
                        isLoading={approveMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => {
                          setSelected(admission);
                          onOpen();
                        }}
                      >
                        Reject
                      </Button>
                    </HStack>
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
          <ModalHeader>Reject Admission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Please provide a reason for rejection:</Text>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              isDisabled={!rejectReason}
            >
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
