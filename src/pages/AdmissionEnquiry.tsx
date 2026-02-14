import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Select,
  Textarea,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { admissionsApi } from '../services/api';

const admissionSchema = z.object({
  childFirstName: z.string().min(2, 'First name is required'),
  childLastName: z.string().min(2, 'Last name is required'),
  childDateOfBirth: z.string().min(1, 'Date of birth is required'),
  childGender: z.string().min(1, 'Gender is required'),
  parentFirstName: z.string().min(2, 'Parent first name is required'),
  parentLastName: z.string().min(2, 'Parent last name is required'),
  parentEmail: z.string().email('Invalid email address'),
  parentPhone: z.string().min(10, 'Valid phone number is required'),
  alternatePhone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
  }),
  preferredClass: z.string().min(1, 'Please select a class'),
  academicYear: z.string().min(1, 'Please select academic year'),
});

type AdmissionForm = z.infer<typeof admissionSchema>;

export const AdmissionEnquiry = () => {
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdmissionForm>({
    resolver: zodResolver(admissionSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: AdmissionForm) => admissionsApi.create(data),
    onSuccess: () => {
      setSubmitted(true);
      reset();
      toast({
        title: 'Application Submitted!',
        description: 'We will contact you soon regarding the admission.',
        status: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: 'Submission Failed',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: AdmissionForm) => {
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <Box minH="100vh" bg="gray.50" py={12}>
        <Container maxW="lg">
          <Card>
            <CardBody textAlign="center" py={12}>
              <Heading size="lg" color="green.500" mb={4}>
                Application Submitted Successfully!
              </Heading>
              <Text color="gray.600" mb={6}>
                Thank you for your interest in Tiaz Kidz Preschool. Our admissions team will
                review your application and contact you within 2-3 business days.
              </Text>
              <Button onClick={() => setSubmitted(false)} colorScheme="brand">
                Submit Another Application
              </Button>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="3xl">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center" mb={4}>
            <Heading size="xl" color="brand.500" mb={2}>
              Tiaz Kidz Preschool
            </Heading>
            <Heading size="md" fontWeight="normal" color="gray.600">
              Admission Enquiry Form
            </Heading>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            Please fill out all required fields. Our team will contact you after reviewing your
            application.
          </Alert>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={6} align="stretch">
                  {/* Child Information */}
                  <Box>
                    <Heading size="sm" mb={4} color="brand.600">
                      Child Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isInvalid={!!errors.childFirstName} isRequired>
                        <FormLabel>First Name</FormLabel>
                        <Input {...register('childFirstName')} placeholder="Child's first name" />
                        {errors.childFirstName && (
                          <Text color="red.500" fontSize="sm">{errors.childFirstName.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.childLastName} isRequired>
                        <FormLabel>Last Name</FormLabel>
                        <Input {...register('childLastName')} placeholder="Child's last name" />
                        {errors.childLastName && (
                          <Text color="red.500" fontSize="sm">{errors.childLastName.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.childDateOfBirth} isRequired>
                        <FormLabel>Date of Birth</FormLabel>
                        <Input type="date" {...register('childDateOfBirth')} />
                        {errors.childDateOfBirth && (
                          <Text color="red.500" fontSize="sm">{errors.childDateOfBirth.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.childGender} isRequired>
                        <FormLabel>Gender</FormLabel>
                        <Select {...register('childGender')} placeholder="Select gender">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Select>
                        {errors.childGender && (
                          <Text color="red.500" fontSize="sm">{errors.childGender.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.preferredClass} isRequired>
                        <FormLabel>Preferred Class</FormLabel>
                        <Select {...register('preferredClass')} placeholder="Select class">
                          <option value="Playgroup">Playgroup (1.5 - 2.5 years)</option>
                          <option value="Nursery">Nursery (2.5 - 3.5 years)</option>
                          <option value="LKG">LKG (3.5 - 4.5 years)</option>
                          <option value="UKG">UKG (4.5 - 5.5 years)</option>
                        </Select>
                        {errors.preferredClass && (
                          <Text color="red.500" fontSize="sm">{errors.preferredClass.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.academicYear} isRequired>
                        <FormLabel>Academic Year</FormLabel>
                        <Select {...register('academicYear')} placeholder="Select academic year">
                          <option value="2025-26">2025-26</option>
                          <option value="2026-27">2026-27</option>
                        </Select>
                        {errors.academicYear && (
                          <Text color="red.500" fontSize="sm">{errors.academicYear.message}</Text>
                        )}
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  {/* Parent/Guardian Information */}
                  <Box>
                    <Heading size="sm" mb={4} color="brand.600">
                      Parent/Guardian Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isInvalid={!!errors.parentFirstName} isRequired>
                        <FormLabel>First Name</FormLabel>
                        <Input {...register('parentFirstName')} placeholder="Parent's first name" />
                        {errors.parentFirstName && (
                          <Text color="red.500" fontSize="sm">{errors.parentFirstName.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.parentLastName} isRequired>
                        <FormLabel>Last Name</FormLabel>
                        <Input {...register('parentLastName')} placeholder="Parent's last name" />
                        {errors.parentLastName && (
                          <Text color="red.500" fontSize="sm">{errors.parentLastName.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.parentEmail} isRequired>
                        <FormLabel>Email Address</FormLabel>
                        <Input type="email" {...register('parentEmail')} placeholder="email@example.com" />
                        {errors.parentEmail && (
                          <Text color="red.500" fontSize="sm">{errors.parentEmail.message}</Text>
                        )}
                      </FormControl>
                      <FormControl isInvalid={!!errors.parentPhone} isRequired>
                        <FormLabel>Phone Number</FormLabel>
                        <Input {...register('parentPhone')} placeholder="+91 9876543210" />
                        {errors.parentPhone && (
                          <Text color="red.500" fontSize="sm">{errors.parentPhone.message}</Text>
                        )}
                      </FormControl>
                      <FormControl>
                        <FormLabel>Alternate Phone</FormLabel>
                        <Input {...register('alternatePhone')} placeholder="Optional" />
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  {/* Address */}
                  <Box>
                    <Heading size="sm" mb={4} color="brand.600">
                      Address
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl isInvalid={!!errors.address?.street} isRequired>
                        <FormLabel>Street Address</FormLabel>
                        <Textarea {...register('address.street')} placeholder="House no, Street name, Locality" rows={2} />
                        {errors.address?.street && (
                          <Text color="red.500" fontSize="sm">{errors.address.street.message}</Text>
                        )}
                      </FormControl>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <FormControl isInvalid={!!errors.address?.city} isRequired>
                          <FormLabel>City</FormLabel>
                          <Input {...register('address.city')} placeholder="City" />
                          {errors.address?.city && (
                            <Text color="red.500" fontSize="sm">{errors.address.city.message}</Text>
                          )}
                        </FormControl>
                        <FormControl isInvalid={!!errors.address?.state} isRequired>
                          <FormLabel>State</FormLabel>
                          <Input {...register('address.state')} placeholder="State" />
                          {errors.address?.state && (
                            <Text color="red.500" fontSize="sm">{errors.address.state.message}</Text>
                          )}
                        </FormControl>
                        <FormControl isInvalid={!!errors.address?.zipCode} isRequired>
                          <FormLabel>ZIP Code</FormLabel>
                          <Input {...register('address.zipCode')} placeholder="ZIP Code" />
                          {errors.address?.zipCode && (
                            <Text color="red.500" fontSize="sm">{errors.address.zipCode.message}</Text>
                          )}
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </Box>

                  <Button
                    type="submit"
                    size="lg"
                    colorScheme="brand"
                    isLoading={mutation.isPending}
                    loadingText="Submitting..."
                  >
                    Submit Application
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          <Text textAlign="center" fontSize="sm" color="gray.500">
            For any queries, contact us at admissions@tiazkidz.com or call +91 98765 43210
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};
