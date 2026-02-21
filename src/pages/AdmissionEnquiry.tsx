import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactSelect from 'react-select';
import { AlertCircle, Info } from 'lucide-react';
import { admissionsApi, tenantApi } from '../services/api';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { LoadingPage } from '../components/ui/Spinner';
import { indianStates, getCitiesByState } from '../data/indianLocations';

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
    zipCode: z.string().optional(),
  }),
  preferredClass: z.string().min(1, 'Please select a class'),
  academicYear: z.string().min(1, 'Please select academic year'),
});

type AdmissionForm = z.infer<typeof admissionSchema>;

export const AdmissionEnquiry = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [submitted, setSubmitted] = useState(false);

  const { data: tenantInfo, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: ['tenant-public', tenantSlug],
    queryFn: () => tenantApi.getBySlug(tenantSlug!).then((res) => res.data),
    enabled: !!tenantSlug,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<AdmissionForm>({
    resolver: zodResolver(admissionSchema),
  });

  const selectedState = watch('address.state');

  const stateOptions = useMemo(
    () => indianStates.map((s) => ({ value: s, label: s })),
    []
  );

  const cityOptions = useMemo(
    () => getCitiesByState(selectedState || '').map((c) => ({ value: c, label: c })),
    [selectedState]
  );

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? '#4F46E5' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #4F46E5' : 'none',
      borderRadius: '0.5rem',
      minHeight: '40px',
      fontSize: '0.875rem',
      '&:hover': { borderColor: state.isFocused ? '#4F46E5' : '#9ca3af' },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#EEF2FF' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      fontSize: '0.875rem',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 50,
    }),
  };

  const mutation = useMutation({
    mutationFn: (data: AdmissionForm) =>
      admissionsApi.createForTenant(tenantSlug!, data),
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

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <LoadingPage />
      </div>
    );
  }

  if (tenantError || !tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-lg px-4">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              School not found. Please check the URL and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const schoolName = tenantInfo.name || 'School';
  const classes: string[] = tenantInfo.classes || [];
  const academicYears: string[] = tenantInfo.academicYears || [];
  const primaryColor = tenantInfo.primaryColor || '#4F46E5';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-lg px-4">
          <Card>
            <div className="py-8 text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Application Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in {schoolName}. Our admissions team will
                review your application and contact you within 2-3 business days.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                Submit Another Application
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-4">
            {tenantInfo.logo && (
              <div className="mb-3">
                <img
                  src={tenantInfo.logo}
                  alt={schoolName}
                  className="mx-auto max-h-20"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              {schoolName}
            </h1>
            <h2 className="text-lg text-gray-600">Admission Enquiry Form</h2>
          </div>

          {/* Info Alert */}
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Info className="h-5 w-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700">
              Please fill out all required fields. Our team will contact you after reviewing your
              application.
            </p>
          </div>

          {/* Form Card */}
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Child Information */}
              <div>
                <h3 className="text-sm font-semibold mb-4" style={{ color: primaryColor }}>
                  Child Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('childFirstName')}
                    placeholder="Child's first name"
                    error={errors.childFirstName?.message}
                    required
                  />
                  <Input
                    label="Last Name"
                    {...register('childLastName')}
                    placeholder="Child's last name"
                    error={errors.childLastName?.message}
                    required
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register('childDateOfBirth')}
                    error={errors.childDateOfBirth?.message}
                    required
                  />
                  <Select
                    label="Gender"
                    {...register('childGender')}
                    error={errors.childGender?.message}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                  <Select
                    label="Preferred Class"
                    {...register('preferredClass')}
                    error={errors.preferredClass?.message}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Academic Year"
                    {...register('academicYear')}
                    error={errors.academicYear?.message}
                    required
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div>
                <h3 className="text-sm font-semibold mb-4" style={{ color: primaryColor }}>
                  Parent/Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('parentFirstName')}
                    placeholder="Parent's first name"
                    error={errors.parentFirstName?.message}
                    required
                  />
                  <Input
                    label="Last Name"
                    {...register('parentLastName')}
                    placeholder="Parent's last name"
                    error={errors.parentLastName?.message}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    {...register('parentEmail')}
                    placeholder="email@example.com"
                    error={errors.parentEmail?.message}
                    required
                  />
                  <Input
                    label="Phone Number"
                    {...register('parentPhone')}
                    placeholder="+91 9876543210"
                    error={errors.parentPhone?.message}
                    required
                  />
                  <Input
                    label="Alternate Phone"
                    {...register('alternatePhone')}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold mb-4" style={{ color: primaryColor }}>
                  Address
                </h3>
                <div className="space-y-4">
                  <Textarea
                    label="Street Address"
                    {...register('address.street')}
                    placeholder="House no, Street name, Locality"
                    rows={2}
                    error={errors.address?.street?.message}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="address.state"
                        control={control}
                        render={({ field }) => (
                          <ReactSelect
                            options={stateOptions}
                            value={stateOptions.find((o) => o.value === field.value) || null}
                            onChange={(option) => {
                              field.onChange(option?.value || '');
                              setValue('address.city', '');
                            }}
                            placeholder="Search state..."
                            isClearable
                            isSearchable
                            styles={selectStyles}
                          />
                        )}
                      />
                      {errors.address?.state?.message && (
                        <p className="mt-1 text-xs text-red-500">{errors.address.state.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="address.city"
                        control={control}
                        render={({ field }) => (
                          <ReactSelect
                            options={cityOptions}
                            value={cityOptions.find((o) => o.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            placeholder={selectedState ? 'Search city...' : 'Select state first'}
                            isClearable
                            isSearchable
                            isDisabled={!selectedState}
                            noOptionsMessage={() => selectedState ? 'No cities found' : 'Select a state first'}
                            styles={selectStyles}
                          />
                        )}
                      />
                      {errors.address?.city?.message && (
                        <p className="mt-1 text-xs text-red-500">{errors.address.city.message}</p>
                      )}
                    </div>
                    <Input
                      label="ZIP Code"
                      {...register('address.zipCode')}
                      placeholder="ZIP Code (optional)"
                      error={errors.address?.zipCode?.message}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={mutation.isPending}
              >
                Submit Application
              </Button>
            </form>
          </Card>

          {/* Footer contact info */}
          <p className="text-center text-sm text-gray-500">
            {tenantInfo.contactEmail && (
              <>For queries, contact us at {tenantInfo.contactEmail}</>
            )}
            {tenantInfo.contactPhone && tenantInfo.contactEmail && ' | '}
            {tenantInfo.contactPhone && <>{tenantInfo.contactPhone}</>}
          </p>
        </div>
      </div>
    </div>
  );
};
