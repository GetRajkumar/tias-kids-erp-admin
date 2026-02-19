import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { Payment } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { LoadingPage } from '../components/ui/Spinner';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  completed: 'green',
  failed: 'red',
  refunded: 'gray',
};

export const Payments = () => {
  const { currencySymbol: cs } = useTenant();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
      setIsSheetOpen(false);
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
    return <LoadingPage />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="w-full sm:w-48">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <Table>
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
                  <Td className="capitalize">{payment.type.replace('_', ' ')}</Td>
                  <Td>{cs}{payment.amount.toLocaleString()}</Td>
                  <Td>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '—'}</Td>
                  <Td>
                    <Badge color={statusColors[payment.status]}>{payment.status}</Badge>
                  </Td>
                  <Td>
                    {payment.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={<CheckCircle className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setSelected(payment);
                          setIsSheetOpen(true);
                        }}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
              {(!payments || payments.length === 0) && (
                <Tr>
                  <Td colSpan={6} className="text-center py-8 text-gray-400">
                    No payments found
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      </Card>

      {/* Record Payment Sheet */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setTransactionId('');
            setPaymentMethod('');
          }
        }}
        size="md"
        title="Mark Payment Complete"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsSheetOpen(false);
                setTransactionId('');
                setPaymentMethod('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleComplete}
              loading={completeMutation.isPending}
              disabled={!transactionId || !paymentMethod}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID"
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
          </Select>
        </div>
      </Sheet>
    </div>
  );
};
