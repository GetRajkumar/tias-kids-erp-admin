import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Container,
  Heading,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { AppDispatch } from '../store';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = (data: LoginForm) => {
    dispatch(login(data));
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
          <VStack spacing={6}>
            <Heading size="lg" color="brand.500">
              Tia's Kids ERP
            </Heading>
            <Text color="gray.600">Sign in to admin portal</Text>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...register('email')} placeholder="admin@example.com" />
                  {errors.email && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.email.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...register('password')} placeholder="********" />
                  {errors.password && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.password.message}
                    </Text>
                  )}
                </FormControl>

                <Button type="submit" width="100%" isLoading={isLoading} mt={4}>
                  Sign In
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};
