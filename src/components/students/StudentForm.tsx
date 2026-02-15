import React, { useState } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Textarea,
  Box,
  Divider,
  Heading,
  IconButton,
  Badge,
  Wrap,
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { useForm, Controller } from 'react-hook-form';
import { Student } from '../../types';

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const StudentForm = ({ student, onSubmit, isLoading, isEdit }: StudentFormProps) => {
  const formatDateForInput = (date: string | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm({
    defaultValues: student ? {
      ...student,
      dateOfBirth: formatDateForInput(student.dateOfBirth),
    } : {
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
  const [medicalConditions, setMedicalConditions] = useState<string[]>(student?.medicalInfo?.medicalConditions || []);
  const [allergyInput, setAllergyInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setMedications([...medications, medicationInput]);
      setMedicationInput('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      setMedicalConditions([...medicalConditions, conditionInput]);
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
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <VStack spacing={6}>
        {/* Basic Information */}
        <Box w="100%">
          <Heading size="sm" mb={4}>
            Basic Information
          </Heading>
          <VStack spacing={4}>
            <HStack w="100%">
              <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="First name"
                  isInvalid={!!errors.firstName}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                  {...register('lastName', { required: 'Last name is required' })}
                  placeholder="Last name"
                  isInvalid={!!errors.lastName}
                />
              </FormControl>
            </HStack>

            <HStack w="100%">
              <FormControl isRequired>
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  isInvalid={!!errors.dateOfBirth}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Gender</FormLabel>
                <Select {...register('gender')} placeholder="Select gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack w="100%">
              <FormControl>
                <FormLabel>Blood Group</FormLabel>
                <Select {...register('bloodGroup')} placeholder="Select blood group">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Class</FormLabel>
                <Select {...register('class')} placeholder="Select class">
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Section</FormLabel>
                <Select {...register('section')} placeholder="Select section">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </Select>
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Parent/Guardian Information */}
        {!isEdit && (
          <Box w="100%">
            <Heading size="sm" mb={4}>
              Parent/Guardian Information
            </Heading>
            <VStack spacing={4}>
              <HStack w="100%">
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    {...register('parentInfo.firstName', { required: !isEdit ? 'Parent first name is required' : false })}
                    placeholder="Parent's first name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    {...register('parentInfo.lastName', { required: !isEdit ? 'Parent last name is required' : false })}
                    placeholder="Parent's last name"
                  />
                </FormControl>
              </HStack>
              <HStack w="100%">
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    {...register('parentInfo.email', { required: !isEdit ? 'Email is required' : false })}
                    placeholder="email@example.com"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    {...register('parentInfo.phone', { required: !isEdit ? 'Phone is required' : false })}
                    placeholder="+91 9876543210"
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Alternate Phone</FormLabel>
                <Input
                  {...register('parentInfo.alternatePhone')}
                  placeholder="Optional"
                />
              </FormControl>
            </VStack>
          </Box>
        )}

        <Divider />

        {/* Medical Information */}
        <Box w="100%">
          <Heading size="sm" mb={4}>
            Medical Information
          </Heading>
          <VStack spacing={4}>
            {/* Allergies */}
            <FormControl>
              <FormLabel>Allergies</FormLabel>
              <HStack w="100%">
                <Input
                  placeholder="Enter allergy (e.g., Peanuts)"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (addAllergy(), e.preventDefault())}
                />
                <Button onClick={addAllergy} colorScheme="blue" size="sm">
                  Add
                </Button>
              </HStack>
              <Wrap mt={2} spacing={2}>
                {allergies.map((allergy, index) => (
                  <Badge key={index} colorScheme="red" px={2} py={1}>
                    {allergy}
                    <IconButton
                      aria-label="remove"
                      icon={<FiX />}
                      size="xs"
                      ml={2}
                      variant="ghost"
                      onClick={() => removeAllergy(index)}
                    />
                  </Badge>
                ))}
              </Wrap>
            </FormControl>

            {/* Medical Conditions */}
            <FormControl>
              <FormLabel>Medical Conditions</FormLabel>
              <HStack w="100%">
                <Input
                  placeholder="Enter medical condition (e.g., Asthma)"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (addCondition(), e.preventDefault())}
                />
                <Button onClick={addCondition} colorScheme="blue" size="sm">
                  Add
                </Button>
              </HStack>
              <Wrap mt={2} spacing={2}>
                {medicalConditions.map((condition, index) => (
                  <Badge key={index} colorScheme="orange" px={2} py={1}>
                    {condition}
                    <IconButton
                      aria-label="remove"
                      icon={<FiX />}
                      size="xs"
                      ml={2}
                      variant="ghost"
                      onClick={() => removeCondition(index)}
                    />
                  </Badge>
                ))}
              </Wrap>
            </FormControl>

            {/* Medications */}
            <FormControl>
              <FormLabel>Current Medications</FormLabel>
              <HStack w="100%">
                <Input
                  placeholder="Enter medication (e.g., Inhaler)"
                  value={medicationInput}
                  onChange={(e) => setMedicationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (addMedication(), e.preventDefault())}
                />
                <Button onClick={addMedication} colorScheme="blue" size="sm">
                  Add
                </Button>
              </HStack>
              <Wrap mt={2} spacing={2}>
                {medications.map((medication, index) => (
                  <Badge key={index} colorScheme="green" px={2} py={1}>
                    {medication}
                    <IconButton
                      aria-label="remove"
                      icon={<FiX />}
                      size="xs"
                      ml={2}
                      variant="ghost"
                      onClick={() => removeMedication(index)}
                    />
                  </Badge>
                ))}
              </Wrap>
            </FormControl>

            {/* Special Needs */}
            <FormControl>
              <FormLabel>Special Needs / Notes</FormLabel>
              <Textarea
                {...register('medicalInfo.specialNeeds')}
                placeholder="Any special needs or additional medical notes"
                rows={3}
              />
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        {/* Emergency Contact */}
        <Box w="100%">
          <Heading size="sm" mb={4}>
            Emergency Contact
          </Heading>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Contact Name</FormLabel>
              <Input
                {...register('emergencyContact.name')}
                placeholder="Emergency contact name"
              />
            </FormControl>
            <HStack w="100%">
              <FormControl>
                <FormLabel>Relation</FormLabel>
                <Select {...register('emergencyContact.relation')} placeholder="Select relation">
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  {...register('emergencyContact.phone')}
                  placeholder="Phone number"
                  type="tel"
                />
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Address */}
        <Box w="100%">
          <Heading size="sm" mb={4}>
            Address
          </Heading>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Street Address</FormLabel>
              <Input
                {...register('address.street')}
                placeholder="Street address"
              />
            </FormControl>
            <HStack w="100%">
              <FormControl>
                <FormLabel>City</FormLabel>
                <Input {...register('address.city')} placeholder="City" />
              </FormControl>
              <FormControl>
                <FormLabel>State</FormLabel>
                <Input {...register('address.state')} placeholder="State" />
              </FormControl>
              <FormControl>
                <FormLabel>Zip Code</FormLabel>
                <Input {...register('address.zipCode')} placeholder="Zip code" />
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          colorScheme="blue"
          w="100%"
          isLoading={isLoading}
          size="lg"
        >
          {isEdit ? 'Update Student' : 'Create Student'}
        </Button>
      </VStack>
    </form>
  );
};
