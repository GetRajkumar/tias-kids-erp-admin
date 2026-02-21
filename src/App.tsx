import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store } from './store';
import { TenantProvider } from './contexts/TenantContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingPage } from './components/ui/Spinner';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const AdmissionEnquiry = lazy(() => import('./pages/AdmissionEnquiry').then(m => ({ default: m.AdmissionEnquiry })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Students = lazy(() => import('./pages/Students').then(m => ({ default: m.Students })));
const Admissions = lazy(() => import('./pages/Admissions').then(m => ({ default: m.Admissions })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const PaymentSchedules = lazy(() => import('./pages/PaymentSchedules').then(m => ({ default: m.PaymentSchedules })));
const Tickets = lazy(() => import('./pages/Tickets').then(m => ({ default: m.Tickets })));
const TicketDetail = lazy(() => import('./pages/TicketDetail').then(m => ({ default: m.TicketDetail })));
const Homework = lazy(() => import('./pages/Homework'));
const Announcements = lazy(() => import('./pages/Announcements').then(m => ({ default: m.Announcements })));
const Tenants = lazy(() => import('./pages/Tenants').then(m => ({ default: m.Tenants })));
const TenantManage = lazy(() => import('./pages/TenantManage').then(m => ({ default: m.TenantManage })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

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
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TenantProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingPage />}>
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
                    <Route path="/tickets/:id" element={<TicketDetail />} />
                    <Route path="/homework" element={<Homework />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/tenants" element={<Tenants />} />
                    <Route path="/tenant-manage" element={<TenantManage />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
          </TenantProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
