import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ReactSelect from 'react-select';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Plus,
  Eye,
  Pencil,
  Bell,
  Info,
  CreditCard,
} from 'lucide-react';
import { paymentSchedulesApi, studentsApi } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { cn } from '../lib/utils';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Sheet } from '../components/ui/Sheet';
import { LoadingPage } from '../components/ui/Spinner';
import { Progress } from '../components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

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
  const { currencySymbol: cs } = useTenant();
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [editSchedule, setEditSchedule] = useState<PaymentSchedule | null>(null);
  const [editInstallments, setEditInstallments] = useState<Installment[]>([]);
  const [createInstallments, setCreateInstallments] = useState<Array<{ installmentNumber: number; amount: string; dueDate: string }>>([
    { installmentNumber: 1, amount: '', dueDate: '' },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [advancePayments, setAdvancePayments] = useState<Record<string, { advance: number; admission: number }>>({});
  const [studentsWithAdvance, setStudentsWithAdvance] = useState<Set<string>>(new Set());
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

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-schedule'],
    queryFn: async () => {
      const res = await studentsApi.getAll();
      return res.data;
    },
  });

  // Fetch all advance payments to filter students
  const { data: allAdvancePayments } = useQuery({
    queryKey: ['advance-payments'],
    queryFn: async () => {
      const res = await paymentSchedulesApi.getAllAdvancePayments();
      return res.data;
    },
  });

  // Update set of students with advance payments
  useEffect(() => {
    if (allAdvancePayments) {
      const studentIds = new Set<string>(
        allAdvancePayments
          .filter((ap: any) => !ap.isUsed)
          .map((ap: any) => String(ap.studentId._id || ap.studentId))
      );
      setStudentsWithAdvance(studentIds);
    }
  }, [allAdvancePayments]);

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
      setIsCreateOpen(false);
      reset();
      setCreateInstallments([{ installmentNumber: 1, amount: '', dueDate: '' }]);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create schedule',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentSchedulesApi.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-payments'] });
      toast({ title: 'Payment recorded', status: 'success' });
      setIsPayOpen(false);
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
      setIsEditOpen(false);
      setEditSchedule(null);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update schedule',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: ({ scheduleId, installmentNumber }: { scheduleId: string; installmentNumber: number }) =>
      paymentSchedulesApi.sendReminder(scheduleId, installmentNumber),
    onSuccess: () => {
      toast({ title: 'Payment reminder sent to parent', status: 'success' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send reminder',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      });
    },
  });

  const createAdvancePaymentMutation = useMutation({
    mutationFn: (data: any) => paymentSchedulesApi.createAdvancePayment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['advance-payments'] });
      toast({
        title: 'Advance payment recorded successfully',
        description: `Receipt ID: ${response.data.receiptId}`,
        status: 'success',
        duration: 6000,
      });
      setIsAdvanceOpen(false);
      resetAdvance();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to record advance payment',
        description: error?.response?.data?.message || error.message,
        status: 'error',
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

    // Check total amount
    if (!data.totalAmount || Number(data.totalAmount) <= 0) {
      toast({ title: 'Please enter total amount', status: 'warning' });
      return;
    }

    // Validate installments
    if (createInstallments.length === 0) {
      toast({ title: 'Please add at least one installment', status: 'warning' });
      return;
    }

    const invalidInstallments = createInstallments.filter(
      inst => !inst.amount || !inst.dueDate || Number(inst.amount) <= 0
    );
    if (invalidInstallments.length > 0) {
      toast({ title: 'Please fill all installment fields with valid data', status: 'warning' });
      return;
    }

    const installmentsData = createInstallments.map(inst => ({
      installmentNumber: inst.installmentNumber,
      amount: Number(inst.amount),
      dueDate: inst.dueDate,
    }));

    const totalAmount = Number(data.totalAmount);
    const installmentsTotal = installmentsData.reduce((sum, inst) => sum + inst.amount, 0);

    // Get advance amount if exists
    const advancePayment = allAdvancePayments?.find((ap: any) => 
      !ap.isUsed && (ap.studentId._id === data.studentId || ap.studentId === data.studentId)
    );
    const advanceAmount = advancePayment 
      ? (advancePayment.advanceAmount || 0) + (advancePayment.admissionAmount || 0)
      : 0;

    const maxAllowedInstallments = totalAmount - advanceAmount;

    // Validate installments don't exceed allowed amount
    if (installmentsTotal > maxAllowedInstallments) {
      toast({ 
        title: 'Installments exceed allowed amount', 
        description: `Total installments (${cs}${installmentsTotal.toLocaleString()}) cannot exceed Total Amount - Advance (${cs}${maxAllowedInstallments.toLocaleString()})`,
        status: 'error',
        duration: 6000,
      });
      return;
    }

    createMutation.mutate({
      ...data,
      parentId,
      planType: 'custom',
      totalAmount,
      installments: installmentsData,
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
    setIsPayOpen(true);
  };

  const openEditModal = (schedule: PaymentSchedule) => {
    setEditSchedule(schedule);
    setEditInstallments([...schedule.installments]);
    setEditValue('totalAmount', schedule.totalAmount);
    setEditValue('advancePayment', schedule.advancePayment || 0);
    setEditValue('paidOnAdmission', schedule.paidOnAdmission || 0);
    setEditValue('notes', schedule.notes || '');
    setIsEditOpen(true);
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
    return <LoadingPage />;
  }

  const totalCollected = schedules?.reduce((sum, s) => sum + s.totalPaid, 0) || 0;
  const totalPending = schedules?.reduce((sum, s) => sum + s.totalDue, 0) || 0;
  const overdueCount = overdueData?.length || 0;

  // Get student IDs who already have payment schedules
  const studentsWithSchedules = new Set(schedules?.map((s: any) => s.studentId?._id || s.studentId) || []);

  // Filter students for Advance Payment: exclude those with unused advance payments
  const advanceStudentOptions = students
    ?.filter((s: any) => !studentsWithAdvance.has(s._id))
    ?.map((s: any) => ({
      value: s._id,
      label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
    })) || [];

  // Filter students for Create Schedule: exclude those with existing schedules
  const scheduleStudentOptions = students
    ?.filter((s: any) => !studentsWithSchedules.has(s._id))
    ?.map((s: any) => ({
      value: s._id,
      label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class || 'No Class'}`,
    })) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Schedules</h1>
        <div className="flex gap-2">
          <Button variant="blue" icon={<CreditCard className="h-4 w-4" />} onClick={() => setIsAdvanceOpen(true)}>
            Advance Payment
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-xl font-semibold text-green-600">{cs}{totalCollected.toLocaleString()}</p>
              <p className="text-xs text-gray-400">This academic year</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-xl font-semibold text-orange-600">{cs}{totalPending.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Outstanding amount</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue Payments</p>
              <p className="text-xl font-semibold text-red-600">{overdueCount}</p>
              <p className="text-xs text-gray-400">Require attention</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Schedules</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
        </TabsList>

        {/* All Schedules Tab */}
        <TabsContent value="all">
          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
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
                  {schedules?.map((schedule) => {
                    const pct = schedule.totalAmount > 0
                      ? Math.round((schedule.totalPaid / schedule.totalAmount) * 100)
                      : 0;
                    return (
                      <Tr key={schedule._id}>
                        <Td>
                          <div>
                            <p className="font-medium text-gray-900">
                              {schedule.studentId?.firstName} {schedule.studentId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{schedule.studentId?.studentId}</p>
                          </div>
                        </Td>
                        <Td>{schedule.studentId?.class}</Td>
                        <Td>{planTypeLabels[schedule.planType]}</Td>
                        <Td>{cs}{schedule.totalAmount.toLocaleString()}</Td>
                        <Td>{cs}{schedule.totalPaid.toLocaleString()}</Td>
                        <Td className="w-36">
                          <Progress
                            value={pct}
                            color={schedule.isFullyPaid ? 'green' : 'brand'}
                          />
                          <p className="text-xs text-gray-500 mt-1">{pct}%</p>
                        </Td>
                        <Td>
                          <Badge color={schedule.isFullyPaid ? 'green' : 'yellow'}>
                            {schedule.isFullyPaid ? 'Paid' : 'Pending'}
                          </Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => setSelectedSchedule(schedule)}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                  {(!schedules || schedules.length === 0) && (
                    <Tr>
                      <Td colSpan={8} className="text-center py-8 text-gray-400">
                        No payment schedules found
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue">
          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
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
                        <p className="text-sm">{item.schedule.parentId?.phone}</p>
                        <p className="text-xs text-gray-500">{item.schedule.parentId?.email}</p>
                      </Td>
                      <Td>#{item.installment.installmentNumber}</Td>
                      <Td>{cs}{(item.installment.amount - item.installment.paidAmount).toLocaleString()}</Td>
                      <Td>{new Date(item.installment.dueDate).toLocaleDateString()}</Td>
                      <Td>
                        <Badge color="red">{item.daysOverdue} days</Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => openPayModal(item.schedule, item.installment)}
                          >
                            Record Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-orange"
                            loading={sendReminderMutation.isPending}
                            icon={<Bell className="h-3.5 w-3.5" />}
                            onClick={() =>
                              sendReminderMutation.mutate({
                                scheduleId: item.schedule._id,
                                installmentNumber: item.installment.installmentNumber,
                              })
                            }
                          >
                            Send Reminder
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                  {(!overdueData || overdueData.length === 0) && (
                    <Tr>
                      <Td colSpan={7} className="text-center py-8 text-gray-400">
                        No overdue payments
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Detail Sheet */}
      <Sheet
        open={!!selectedSchedule && !isPayOpen}
        onOpenChange={(open) => { if (!open) setSelectedSchedule(null); }}
        size="lg"
        title={selectedSchedule ? `Payment Schedule - ${selectedSchedule.studentId?.firstName} ${selectedSchedule.studentId?.lastName}` : ''}
        footer={
          selectedSchedule ? (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedSchedule(null)}>
                Close
              </Button>
              <Button
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  openEditModal(selectedSchedule);
                  setSelectedSchedule(null);
                }}
              >
                Edit Schedule
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedSchedule && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-gray-600">
                Academic Year: <strong>{selectedSchedule.academicYear}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Plan: <strong>{planTypeLabels[selectedSchedule.planType]}</strong>
              </p>
            </div>

            <Progress
              value={selectedSchedule.totalAmount > 0 ? (selectedSchedule.totalPaid / selectedSchedule.totalAmount) * 100 : 0}
              color="green"
              size="md"
            />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>Total Amount: <strong>{cs}{selectedSchedule.totalAmount.toLocaleString()}</strong></p>
              <p>Advance Payment: <strong>{cs}{(selectedSchedule.advancePayment || 0).toLocaleString()}</strong></p>
              <p>Paid on Admission: <strong>{cs}{(selectedSchedule.paidOnAdmission || 0).toLocaleString()}</strong></p>
              <p>Total Paid: <strong>{cs}{selectedSchedule.totalPaid.toLocaleString()}</strong></p>
              <p className="text-orange-600">Due: <strong>{cs}{selectedSchedule.totalDue.toLocaleString()}</strong></p>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 pt-2">Installments</h3>
            <Table>
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
                    <Td>{cs}{inst.amount.toLocaleString()}</Td>
                    <Td>{new Date(inst.dueDate).toLocaleDateString()}</Td>
                    <Td>
                      <Badge color={statusColors[inst.status]}>{inst.status}</Badge>
                    </Td>
                    <Td>{cs}{inst.paidAmount.toLocaleString()}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {inst.status !== 'paid' && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => openPayModal(selectedSchedule, inst)}
                          >
                            Record
                          </Button>
                        )}
                        {inst.status !== 'paid' && (
                          <Button
                            size="xs"
                            variant="outline-orange"
                            loading={sendReminderMutation.isPending}
                            onClick={() =>
                              sendReminderMutation.mutate({
                                scheduleId: selectedSchedule._id,
                                installmentNumber: inst.installmentNumber,
                              })
                            }
                          >
                            Remind
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Sheet>

      {/* Edit Schedule Sheet */}
      <Sheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        size="lg"
        title={`Edit Payment Schedule - ${editSchedule?.studentId?.firstName} ${editSchedule?.studentId?.lastName}`}
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Total Amount (${cs})`}
              type="number"
              {...registerEdit('totalAmount')}
            />
            <Input
              label={`Advance Payment (${cs})`}
              type="number"
              {...registerEdit('advancePayment')}
            />
            <Input
              label={`Paid on Admission (${cs})`}
              type="number"
              {...registerEdit('paidOnAdmission')}
            />
            <Input
              label="Notes"
              {...registerEdit('notes')}
            />
          </div>

          <h3 className="text-sm font-semibold text-gray-900 pt-2">Installments (Edit Amounts &amp; Due Dates)</h3>
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Amount ({cs})</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {editInstallments.map((inst, idx) => (
                  <Tr key={inst.installmentNumber}>
                    <Td>{inst.installmentNumber}</Td>
                    <Td>
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                        value={inst.amount}
                        onChange={(e) => updateInstallment(idx, 'amount', e.target.value)}
                        disabled={inst.status === 'paid'}
                      />
                    </Td>
                    <Td>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                        value={new Date(inst.dueDate).toISOString().split('T')[0]}
                        onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)}
                        disabled={inst.status === 'paid'}
                      />
                    </Td>
                    <Td>
                      <Badge color={statusColors[inst.status]} size="sm">
                        {inst.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          <Button type="submit" className="w-full" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </Sheet>

      {/* Create Schedule Sheet */}
      <Sheet
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            reset();
            setCreateInstallments([{ installmentNumber: 1, amount: '', dueDate: '' }]);
          }
        }}
        size="lg"
        title="Create Payment Schedule"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Student {studentsLoading && '(Loading...)'}
            </label>
            <Controller
              name="studentId"
              control={control}
              rules={{ required: 'Student is required' }}
              render={({ field }) => (
                <ReactSelect
                  placeholder="Search and select student..."
                  isLoading={studentsLoading}
                  options={scheduleStudentOptions}
                  onChange={(option: any) => field.onChange(option?.value)}
                  value={scheduleStudentOptions.find((opt: any) => opt.value === field.value) || null}
                  isClearable
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: '#d1d5db',
                      '&:hover': { borderColor: '#9ca3af' },
                      boxShadow: 'none',
                      fontSize: '14px',
                    }),
                    option: (base) => ({
                      ...base,
                      fontSize: '14px',
                    }),
                  }}
                />
              )}
            />
            {scheduleStudentOptions?.length === 0 && (
              <p className="text-xs text-red-500">No students available. All students already have schedules.</p>
            )}
          </div>

          <Input
            label="Academic Year"
            {...register('academicYear')}
            placeholder="Select student first"
            readOnly
            className="bg-gray-50"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Total Amount (${cs})`}
              type="number"
              {...register('totalAmount', { required: 'Total amount is required' })}
              placeholder="50000"
            />
            {selectedStudentId && studentsWithAdvance.has(selectedStudentId) && allAdvancePayments?.find((ap: any) => !ap.isUsed && (ap.studentId._id === selectedStudentId || ap.studentId === selectedStudentId)) && (
              <Input
                label={`Advance Paid (${cs})`}
                type="number"
                value={
                  (allAdvancePayments.find((ap: any) => !ap.isUsed && (ap.studentId._id === selectedStudentId || ap.studentId === selectedStudentId))?.advanceAmount || 0) +
                  (allAdvancePayments.find((ap: any) => !ap.isUsed && (ap.studentId._id === selectedStudentId || ap.studentId === selectedStudentId))?.admissionAmount || 0)
                }
                readOnly
                className="bg-gray-50"
              />
            )}
          </div>

          {/* Custom Installments Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Installments</label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCreateInstallments([
                    ...createInstallments,
                    {
                      installmentNumber: createInstallments.length + 1,
                      amount: '',
                      dueDate: '',
                    },
                  ]);
                }}
              >
                + Add Installment
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <Thead>
                  <Tr>
                    <Th className="w-16">#</Th>
                    <Th>Amount ({cs})</Th>
                    <Th>Due Date</Th>
                    <Th className="w-20">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {createInstallments.map((inst, index) => (
                    <Tr key={index}>
                      <Td>{inst.installmentNumber}</Td>
                      <Td>
                        <input
                          type="number"
                          value={inst.amount}
                          onChange={(e) => {
                            const updated = [...createInstallments];
                            updated[index].amount = e.target.value;
                            setCreateInstallments(updated);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="5000"
                        />
                      </Td>
                      <Td>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const updated = [...createInstallments];
                            updated[index].dueDate = e.target.value;
                            setCreateInstallments(updated);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </Td>
                      <Td>
                        {createInstallments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = createInstallments.filter((_, i) => i !== index);
                              // Renumber
                              updated.forEach((inst, i) => {
                                inst.installmentNumber = i + 1;
                              });
                              setCreateInstallments(updated);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-700">
                  Installments Total: <strong>{cs}{createInstallments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0).toLocaleString()}</strong>
                </p>
              </div>

              {(() => {
                const totalAmount = Number(watch('totalAmount')) || 0;
                const installmentsTotal = createInstallments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                const advancePayment = allAdvancePayments?.find((ap: any) => 
                  !ap.isUsed && (ap.studentId._id === selectedStudentId || ap.studentId === selectedStudentId)
                );
                const advanceAmount = advancePayment 
                  ? (advancePayment.advanceAmount || 0) + (advancePayment.admissionAmount || 0)
                  : 0;
                const maxAllowed = totalAmount - advanceAmount;
                const isExceeding = installmentsTotal > maxAllowed;

                if (totalAmount > 0) {
                  return (
                    <div className={`rounded-lg border p-3 ${isExceeding ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <div className="text-sm space-y-1">
                        <p className={isExceeding ? 'text-red-700' : 'text-green-700'}>
                          Total Amount: <strong>{cs}{totalAmount.toLocaleString()}</strong>
                        </p>
                        {advanceAmount > 0 && (
                          <p className={isExceeding ? 'text-red-700' : 'text-green-700'}>
                            - Advance Paid: <strong>{cs}{advanceAmount.toLocaleString()}</strong>
                          </p>
                        )}
                        <p className={isExceeding ? 'text-red-700 font-semibold' : 'text-green-700 font-semibold'}>
                          = Max Installments: <strong>{cs}{maxAllowed.toLocaleString()}</strong>
                        </p>
                        {isExceeding && (
                          <p className="text-red-600 font-semibold mt-2">
                            ⚠️ Installments exceed allowed amount by {cs}{(installmentsTotal - maxAllowed).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <Input
            label="Notes (Optional)"
            {...register('notes')}
            placeholder="Optional notes"
          />

          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Create Schedule
          </Button>
        </form>
      </Sheet>

      {/* Record Payment Sheet */}
      <Sheet
        open={isPayOpen}
        onOpenChange={(open) => {
          setIsPayOpen(open);
          if (!open) resetPay();
        }}
        size="md"
        title="Record Payment"
      >
        <p className="text-sm text-gray-600 mb-4">
          Installment #{selectedInstallment?.installmentNumber} —{' '}
          Due: {cs}{((selectedInstallment?.amount || 0) - (selectedInstallment?.paidAmount || 0)).toLocaleString()}
        </p>
        <form onSubmit={handlePaySubmit(onPaySubmit)} className="space-y-4">
          <Input
            label={`Amount (${cs})`}
            type="number"
            {...registerPay('amount')}
            defaultValue={(selectedInstallment?.amount || 0) - (selectedInstallment?.paidAmount || 0)}
          />

          <Input
            label="Transaction ID"
            {...registerPay('transactionId')}
            placeholder="TXN123456"
          />

          <Select label="Payment Method" {...registerPay('paymentMethod')}>
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online (Razorpay - via App)</option>
          </Select>

          <Input
            label="Remarks"
            {...registerPay('remarks')}
            placeholder="Optional"
          />

          <Button type="submit" variant="success" className="w-full" loading={recordPaymentMutation.isPending}>
            Record Payment
          </Button>
        </form>
      </Sheet>

      {/* Advance Payment Sheet */}
      <Sheet
        open={isAdvanceOpen}
        onOpenChange={(open) => {
          setIsAdvanceOpen(open);
          if (!open) resetAdvance();
        }}
        size="md"
        title="Collect Advance / Admission Fee"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700">
              Advance payments are recorded here and automatically deducted when you create a fee schedule for this student.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Student</label>
            <Controller
              name="studentId"
              control={controlAdvance}
              rules={{ required: 'Student is required' }}
              render={({ field }) => (
                <ReactSelect
                  placeholder="Search and select student..."
                  isLoading={studentsLoading}
                  options={advanceStudentOptions}
                  onChange={(option: any) => field.onChange(option?.value)}
                  value={advanceStudentOptions.find((opt: any) => opt.value === field.value) || null}
                  isClearable
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: '#d1d5db',
                      '&:hover': { borderColor: '#9ca3af' },
                      boxShadow: 'none',
                      fontSize: '14px',
                    }),
                    option: (base) => ({
                      ...base,
                      fontSize: '14px',
                    }),
                  }}
                />
              )}
            />
            {advanceStudentOptions?.length === 0 && (
              <p className="text-xs text-red-500">All students already have advance payments.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Advance Payment (${cs})`}
              type="number"
              {...registerAdvance('advanceAmount')}
              placeholder="0"
            />
            <Input
              label={`Admission Fee (${cs})`}
              type="number"
              {...registerAdvance('admissionAmount')}
              placeholder="0"
            />
          </div>

          <Input
            label="Receipt ID"
            {...registerAdvance('receiptId', { required: 'Receipt ID is required' })}
            placeholder="e.g., ADV-2024-001"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Payment Method" {...registerAdvance('paymentMethod', { required: 'Payment method is required' })}>
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </Select>

            <Input
              label="Transaction ID (Optional)"
              {...registerAdvance('transactionId')}
              placeholder="Bank ref / UPI ID"
            />
          </div>

          <Input
            label="Remarks (Optional)"
            {...registerAdvance('remarks')}
            placeholder="Any additional notes"
          />

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              Total:{' '}
              <strong>
                {cs}{((Number(watchAdvance('advanceAmount')) || 0) + (Number(watchAdvance('admissionAmount')) || 0)).toLocaleString()}
              </strong>
            </p>
          </div>

          <Button
            variant="blue"
            className="w-full"
            loading={createAdvancePaymentMutation.isPending}
            onClick={handleAdvanceSubmit((data: any) => {
              if (!data.studentId) {
                toast({ title: 'Please select a student', status: 'warning' });
                return;
              }
              if (!data.receiptId || !data.receiptId.trim()) {
                toast({ title: 'Receipt ID is required', status: 'warning' });
                return;
              }
              if (!data.paymentMethod) {
                toast({ title: 'Payment method is required', status: 'warning' });
                return;
              }
              const totalAmount = (Number(data.advanceAmount) || 0) + (Number(data.admissionAmount) || 0);
              if (totalAmount <= 0) {
                toast({ title: 'Enter at least one payment amount', status: 'warning' });
                return;
              }

              // Get student and parent info
              const student = students?.find((s: any) => s._id === data.studentId);
              if (!student) {
                toast({ title: 'Student not found', status: 'error' });
                return;
              }

              const parentId = student?.parentId?._id || student?.parentId;
              if (!parentId) {
                toast({ title: 'Student has no parent linked', status: 'error' });
                return;
              }

              createAdvancePaymentMutation.mutate({
                studentId: data.studentId,
                parentId,
                advanceAmount: Number(data.advanceAmount) || 0,
                admissionAmount: Number(data.admissionAmount) || 0,
                receiptId: data.receiptId.trim(),
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId?.trim() || '',
                remarks: data.remarks?.trim() || '',
              });
            })}
          >
            Record Payment
          </Button>
        </div>
      </Sheet>
    </div>
  );
};
