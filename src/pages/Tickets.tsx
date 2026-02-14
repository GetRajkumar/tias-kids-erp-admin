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
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../services/api';
import { Ticket } from '../types';

const statusColors: Record<string, string> = {
  open: 'yellow',
  in_progress: 'blue',
  resolved: 'green',
  closed: 'gray',
};

const priorityColors: Record<string, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

export const Tickets = () => {
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', filter],
    queryFn: async () => {
      const res = await ticketsApi.getAll(filter || undefined);
      return res.data;
    },
  });

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
        <Heading size="lg">Support Tickets</Heading>
        <Select maxW="200px" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Ticket #</Th>
              <Th>Subject</Th>
              <Th>Category</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tickets?.map((ticket) => (
              <Tr key={ticket._id}>
                <Td>
                  <Text fontWeight="medium">{ticket.ticketNumber}</Text>
                </Td>
                <Td>{ticket.subject}</Td>
                <Td>{ticket.category}</Td>
                <Td>
                  <Badge colorScheme={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                </Td>
                <Td>
                  <Badge colorScheme={statusColors[ticket.status]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </Td>
                <Td>{new Date(ticket.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/tickets/${ticket._id}`)}>
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
