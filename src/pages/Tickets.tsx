import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ticketsApi } from '../services/api';
import { Ticket } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { LoadingPage } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';

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
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <Select
          className="w-full sm:w-[200px]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      <Card padding={false}>
        <Table>
          <Thead>
            <Tr>
              <Th>Ticket #</Th>
              <Th>Subject</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Created</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tickets?.map((ticket) => (
              <Tr key={ticket._id}>
                <Td>
                  <span className="font-medium text-gray-900">{ticket.ticketNumber}</span>
                </Td>
                <Td>{ticket.subject}</Td>
                <Td className="hidden md:table-cell">{ticket.category}</Td>
                <Td>
                  <Badge color={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                </Td>
                <Td>
                  <Badge color={statusColors[ticket.status]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </Td>
                <Td className="hidden sm:table-cell">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
            {tickets?.length === 0 && (
              <Tr>
                <Td colSpan={7}>
                  <div className="py-8 text-center text-gray-500">No tickets found</div>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
};
