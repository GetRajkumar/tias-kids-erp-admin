import { Box } from '@chakra-ui/react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';

export const MainLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Sidebar />
      <Header />
      <Box ml="250px" pt="80px" p={6}>
        <Outlet />
      </Box>
    </Box>
  );
};
