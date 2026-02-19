import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store } from './store';
import { TenantProvider } from './contexts/TenantContext';
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
import { Announcements } from './pages/Announcements';
import { Tenants } from './pages/Tenants';
import { Settings } from './pages/Settings';
import Homework from './pages/Homework';

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
        <TenantProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admission-enquiry/:tenantSlug" element={<AdmissionEnquiry />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/payment-schedules" element={<PaymentSchedules />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/homework" element={<Homework />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </TenantProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
