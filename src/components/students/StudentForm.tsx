import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Student } from '../../types';
import { useTenant } from '../../contexts/TenantContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const StudentForm = ({ student, onSubmit, isLoading, isEdit }: StudentFormProps) => {
  const { classes, sections } = useTenant();

  const formatDateForInput = (date: string | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: student
      ? {
          ...student,
          dateOfBirth: formatDateForInput(student.dateOfBirth),
        }
      : {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          bloodGroup: '',
          class: '',
          section: '',
          address: {},
          emergencyContact: {},
          medicalInfo: {
            allergies: [],
            medications: [],
            medicalConditions: [],
            specialNeeds: '',
          },
          parentInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            alternatePhone: '',
          },
        },
  });

  const [allergies, setAllergies] = useState<string[]>(student?.medicalInfo?.allergies || []);
  const [medications, setMedications] = useState<string[]>(student?.medicalInfo?.medications || []);
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    student?.medicalInfo?.medicalConditions || []
  );
  const [allergyInput, setAllergyInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setMedications([...medications, medicationInput.trim()]);
      setMedicationInput('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      setMedicalConditions([...medicalConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const removeCondition = (index: number) => {
    setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: any) => {
    const { _id, studentId, admissionDate, status, documents, createdAt, updatedAt, __v, ...cleanData } = data;
    const submittedData = {
      ...cleanData,
      parentId: cleanData.parentId?._id || cleanData.parentId || undefined,
      medicalInfo: {
        allergies,
        medications,
        medicalConditions,
        specialNeeds: data.medicalInfo?.specialNeeds || '',
      },
    };
    onSubmit(submittedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="First name"
            {...register('firstName', { required: 'First name is required' })}
            error={errors.firstName?.message as string}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            {...register('lastName', { required: 'Last name is required' })}
            error={errors.lastName?.message as string}
          />
          <Input
            label="Date of Birth"
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            error={errors.dateOfBirth?.message as string}
          />
          <Select label="Gender" {...register('gender')}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
          <Select label="Blood Group" {...register('bloodGroup')}>
            <option value="">Select blood group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </Select>
          <Select label="Class" {...register('class')}>
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </Select>
          <Select label="Section" {...register('section')}>
            <option value="">Select section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </Select>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Parent/Guardian Information */}
      {!isEdit && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Parent's first name"
                {...register('parentInfo.firstName', {
                  required: !isEdit ? 'Parent first name is required' : false,
                })}
              />
              <Input
                label="Last Name"
                placeholder="Parent's last name"
                {...register('parentInfo.lastName', {
                  required: !isEdit ? 'Parent last name is required' : false,
                })}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="email@example.com"
                {...register('parentInfo.email', {
                  required: !isEdit ? 'Email is required' : false,
                })}
              />
              <Input
                label="Phone Number"
                placeholder="+91 9876543210"
                {...register('parentInfo.phone', {
                  required: !isEdit ? 'Phone is required' : false,
                })}
              />
              <Input
                label="Alternate Phone"
                placeholder="Optional"
                {...register('parentInfo.alternatePhone')}
              />
            </div>
          </div>
          <hr className="border-gray-200" />
        </>
      )}

      {/* Medical Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Medical Information</h3>
        <div className="space-y-4">
          {/* Allergies */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Allergies</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter allergy (e.g., Peanuts)"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addAllergy}>
                Add
              </Button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allergies.map((allergy, index) => (
                  <Badge key={index} color="red" className="gap-1">
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="ml-1 hover:text-red-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Medical Conditions */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter medical condition (e.g., Asthma)"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCondition();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addCondition}>
                Add
              </Button>
            </div>
            {medicalConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {medicalConditions.map((condition, index) => (
                  <Badge key={index} color="orange" className="gap-1">
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="ml-1 hover:text-orange-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Current Medications</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter medication (e.g., Inhaler)"
                value={medicationInput}
                onChange={(e) => setMedicationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMedication();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addMedication}>
                Add
              </Button>
            </div>
            {medications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {medications.map((medication, index) => (
                  <Badge key={index} color="green" className="gap-1">
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="ml-1 hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Special Needs */}
          <Textarea
            label="Special Needs / Notes"
            placeholder="Any special needs or additional medical notes"
            rows={3}
            {...register('medicalInfo.specialNeeds')}
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Emergency Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Contact Name"
              placeholder="Emergency contact name"
              {...register('emergencyContact.name')}
            />
          </div>
          <Select label="Relation" {...register('emergencyContact.relation')}>
            <option value="">Select relation</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Grandmother">Grandmother</option>
            <option value="Grandfather">Grandfather</option>
            <option value="Uncle">Uncle</option>
            <option value="Aunt">Aunt</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            label="Phone Number"
            placeholder="Phone number"
            type="tel"
            {...register('emergencyContact.phone')}
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              placeholder="Street address"
              {...register('address.street')}
            />
          </div>
          <Input label="City" placeholder="City" {...register('address.city')} />
          <Input label="State" placeholder="State" {...register('address.state')} />
          <Input label="Zip Code" placeholder="Zip code" {...register('address.zipCode')} />
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" loading={isLoading} className="w-full" size="lg">
        {isEdit ? 'Update Student' : 'Create Student'}
      </Button>
    </form>
  );
};
