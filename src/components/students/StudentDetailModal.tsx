import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { Student } from '../../types';
import { studentsApi, usersApi } from '../../services/api';
import { StudentForm } from './StudentForm';
import { Sheet } from '../ui/Sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { toast } from '../ui/toast';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export const StudentDetailModal = ({ isOpen, onClose, studentId }: StudentDetailModalProps) => {
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

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsEditMode(false);
      onClose();
    }
  };

  if (!studentId) return null;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      {!isEditMode ? (
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setIsEditMode(true)}>
            Edit Student
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={() => setIsEditMode(false)}>
          Cancel
        </Button>
      )}
    </div>
  );

  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleClose}
      side="right"
      size="xl"
      title={isEditMode ? 'Edit Student' : 'Student Details'}
      footer={footer}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : isEditMode ? (
        <StudentForm
          student={student}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          isEdit
        />
      ) : (
        student && <StudentDetailView student={student} />
      )}
    </Sheet>
  );
};

const StudentDetailView = ({ student }: { student: Student }) => {
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
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="parent">Parent</TabsTrigger>
        <TabsTrigger value="medical">Medical</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="address">Address</TabsTrigger>
      </TabsList>

      {/* General Tab */}
      <TabsContent value="general">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Student ID</p>
            <p className="text-base text-gray-900">{student.studentId}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Full Name</p>
            <p className="text-base text-gray-900">
              {student.firstName} {student.lastName}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Date of Birth</p>
              <p className="text-sm text-gray-900">
                {new Date(student.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Gender</p>
              <p className="text-sm text-gray-900">{student.gender || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Blood Group</p>
              {student.bloodGroup ? (
                <Badge color="red">{student.bloodGroup}</Badge>
              ) : (
                <p className="text-sm text-gray-400">-</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Status</p>
              <Badge color={student.status === 'active' ? 'green' : 'gray'}>
                {student.status}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Class</p>
              <p className="text-sm text-gray-900">{student.class || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Section</p>
              <p className="text-sm text-gray-900">{student.section || '-'}</p>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Parent Tab */}
      <TabsContent value="parent">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Parent/Guardian Details</h3>
            {!isEditingParent && parent && (
              <Button size="sm" onClick={startEditParent}>
                Edit Parent
              </Button>
            )}
          </div>

          {!parent ? (
            <p className="text-sm text-gray-500">No parent linked to this student</p>
          ) : isEditingParent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={parentForm.firstName}
                  onChange={(e) => setParentForm({ ...parentForm, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={parentForm.lastName}
                  onChange={(e) => setParentForm({ ...parentForm, lastName: e.target.value })}
                />
              </div>
              <Input label="Email (not editable)" value={parent.email || ''} disabled />
              <Input
                label="Phone"
                value={parentForm.phone}
                onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <Button onClick={saveParent} loading={updateParentMutation.isPending}>
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingParent(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">First Name</p>
                  <p className="text-sm text-gray-900">{parent.firstName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Last Name</p>
                  <p className="text-sm text-gray-900">{parent.lastName || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{parent.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{parent.phone || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Medical Tab */}
      <TabsContent value="medical">
        <div className="space-y-5">
          {/* Allergies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Allergies</h4>
            {student.medicalInfo?.allergies && student.medicalInfo.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.medicalInfo.allergies.map((allergy, idx) => (
                  <Badge key={idx} color="red">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No allergies recorded</p>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Medical Conditions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Medical Conditions</h4>
            {student.medicalInfo?.medicalConditions &&
            student.medicalInfo.medicalConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.medicalInfo.medicalConditions.map((condition, idx) => (
                  <Badge key={idx} color="orange">
                    {condition}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medical conditions recorded</p>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Medications */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Medications</h4>
            {student.medicalInfo?.medications && student.medicalInfo.medications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.medicalInfo.medications.map((medication, idx) => (
                  <Badge key={idx} color="green">
                    {medication}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medications recorded</p>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Special Needs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Special Needs / Notes</h4>
            <p className={`text-sm whitespace-pre-wrap ${student.medicalInfo?.specialNeeds ? 'text-gray-900' : 'text-gray-500'}`}>
              {student.medicalInfo?.specialNeeds || 'No special needs recorded'}
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Contact Tab */}
      <TabsContent value="contact">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
          <div>
            <p className="text-sm font-semibold text-gray-500">Name</p>
            <p className="text-sm text-gray-900">{student.emergencyContact?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Relation</p>
            <p className="text-sm text-gray-900">{student.emergencyContact?.relation || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Phone</p>
            <p className="text-sm text-gray-900">{student.emergencyContact?.phone || '-'}</p>
          </div>
        </div>
      </TabsContent>

      {/* Address Tab */}
      <TabsContent value="address">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Street</p>
            <p className="text-sm text-gray-900">{student.address?.street || '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">City</p>
              <p className="text-sm text-gray-900">{student.address?.city || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">State</p>
              <p className="text-sm text-gray-900">{student.address?.state || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Zip Code</p>
            <p className="text-sm text-gray-900">{student.address?.zipCode || '-'}</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
