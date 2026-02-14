import {
  Box,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { AppDispatch } from '../../store';

export const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box
      bg="white"
      px={6}
      py={4}
      borderBottom="1px"
      borderColor="gray.200"
      position="fixed"
      top={0}
      left="250px"
      right={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          Admin Portal
        </Text>
        <HStack spacing={4}>
          <IconButton
            aria-label="Notifications"
            icon={<FiBell />}
            variant="ghost"
            size="md"
          />
          <Menu>
            <MenuButton>
              <HStack>
                <Avatar size="sm" name={user ? `${user.firstName} ${user.lastName}` : ''} />
                <Text fontSize="sm" fontWeight="medium">
                  {user?.firstName} {user?.lastName}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};
