import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { ticketsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { LoadingPage } from '../components/ui/Spinner';
import { toast } from '../components/ui/toast';

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

export const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await ticketsApi.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const addMessageMutation = useMutation({
    mutationFn: (msg: string) => ticketsApi.addMessage(id!, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setMessage('');
      toast({ status: 'success', title: 'Message sent' });
    },
    onError: () => toast({ status: 'error', title: 'Failed to send message' }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => ticketsApi.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ status: 'success', title: 'Status updated' });
    },
    onError: () => toast({ status: 'error', title: 'Failed to update status' }),
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    addMessageMutation.mutate(message.trim());
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus && newStatus !== ticket?.status) {
      setStatusUpdate(newStatus);
      updateStatusMutation.mutate(newStatus);
    }
  };

  if (isLoading) return <LoadingPage />;

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/tickets')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {ticket.messages?.map((msg: any, index: number) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.senderName || 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{msg.message}</p>
                </div>
              ))}
              {(!ticket.messages || ticket.messages.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
              )}
            </div>
          </Card>

          {/* Reply */}
          <Card>
            <div className="flex gap-3">
              <textarea
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                rows={3}
                placeholder="Type your reply..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendMessage();
                }}
              />
              <Button
                size="sm"
                icon={<Send className="h-4 w-4" />}
                onClick={handleSendMessage}
                loading={addMessageMutation.isPending}
                disabled={!message.trim()}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge color={statusColors[statusUpdate || ticket.status]}>
                  {(statusUpdate || ticket.status).replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <Badge color={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm text-gray-900 capitalize">{ticket.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created By</span>
                <span className="text-sm text-gray-900">
                  {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
            <Select value={statusUpdate || ticket.status} onChange={handleStatusChange}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </Card>
        </div>
      </div>
    </div>
  );
};
