import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  Spinner,
  Center,
  Icon,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiUsers, FiUserPlus, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { reportsApi } from '../services/api';
import { DashboardStats } from '../types';

const StatCard = ({
  label,
  value,
  helpText,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  helpText?: string;
  icon: any;
  color: string;
}) => (
  <Card>
    <CardBody>
      <Stat>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <StatLabel color="gray.500">{label}</StatLabel>
            <StatNumber fontSize="2xl">{value}</StatNumber>
            {helpText && <StatHelpText>{helpText}</StatHelpText>}
          </Box>
          <Box p={3} bg={`${color}.50`} borderRadius="lg">
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Box>
        </Box>
      </Stat>
    </CardBody>
  </Card>
);

export const Dashboard = () => {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await reportsApi.getDashboard();
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
      <Heading size="lg" mb={6}>
        Dashboard
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          label="Total Students"
          value={data?.totalStudents || 0}
          helpText={`${data?.activeStudents || 0} active`}
          icon={FiUsers}
          color="brand"
        />
        <StatCard
          label="Pending Admissions"
          value={data?.pendingAdmissions || 0}
          helpText="Awaiting review"
          icon={FiUserPlus}
          color="secondary"
        />
        <StatCard
          label="Today's Attendance"
          value={`${data?.todayAttendance?.present || 0}/${data?.todayAttendance?.total || 0}`}
          helpText={`${data?.todayAttendance?.absent || 0} absent`}
          icon={FiCalendar}
          color="green"
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${(data?.monthlyRevenue || 0).toLocaleString()}`}
          helpText={`${data?.pendingPayments || 0} pending`}
          icon={FiDollarSign}
          color="orange"
        />
      </SimpleGrid>
    </Box>
  );
};
