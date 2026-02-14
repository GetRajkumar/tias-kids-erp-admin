import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { store } from './store';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Admissions } from './pages/Admissions';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Tickets } from './pages/Tickets';
import { AdmissionEnquiry } from './pages/AdmissionEnquiry';
import { PaymentSchedules } from './pages/PaymentSchedules';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admission-enquiry" element={<AdmissionEnquiry />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/payment-schedules" element={<PaymentSchedules />} />
                <Route path="/tickets" element={<Tickets />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
