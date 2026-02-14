import { Box, VStack, Text, Icon, Flex, Divider } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiMessageSquare,
  FiSettings,
} from 'react-icons/fi';

const menuItems = [
  { icon: FiHome, label: 'Dashboard', path: '/' },
  { icon: FiUsers, label: 'Students', path: '/students' },
  { icon: FiUserPlus, label: 'Admissions', path: '/admissions' },
  { icon: FiCalendar, label: 'Attendance', path: '/attendance' },
  { icon: FiDollarSign, label: 'Payments', path: '/payments' },
  { icon: FiMessageSquare, label: 'Tickets', path: '/tickets' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <Box
      w="250px"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      py={4}
    >
      <Flex px={6} py={4} align="center">
        <Text fontSize="xl" fontWeight="bold" color="brand.500">
          Tia's Kids
        </Text>
      </Flex>
      <Divider />
      <VStack spacing={1} align="stretch" mt={4} px={3}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Flex
                align="center"
                px={4}
                py={3}
                borderRadius="md"
                bg={isActive ? 'brand.50' : 'transparent'}
                color={isActive ? 'brand.600' : 'gray.600'}
                _hover={{ bg: 'brand.50', color: 'brand.600' }}
                transition="all 0.2s"
              >
                <Icon as={item.icon} mr={3} boxSize={5} />
                <Text fontWeight={isActive ? '600' : '400'}>{item.label}</Text>
              </Flex>
            </Link>
          );
        })}
      </VStack>
      <Box position="absolute" bottom={4} left={0} right={0} px={3}>
        <Link to="/settings">
          <Flex
            align="center"
            px={4}
            py={3}
            borderRadius="md"
            color="gray.600"
            _hover={{ bg: 'gray.100' }}
          >
            <Icon as={FiSettings} mr={3} boxSize={5} />
            <Text>Settings</Text>
          </Flex>
        </Link>
      </Box>
    </Box>
  );
};
