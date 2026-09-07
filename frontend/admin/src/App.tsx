import { type ReactNode } from 'react';
import '@/lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import UsersPage from '@/pages/users';
import ProductsPage from '@/pages/products';
import CategoriesPage from '@/pages/categories';
import SettingsPage from '@/pages/settings';
import ReportsPage from '@/pages/reports';
import OrdersPage from '@/pages/orders';
import Shell from '@/components/layout/shell';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        <Route path="/dashboard">
          <Shell>
            <DashboardPage />
          </Shell>
        </Route>
        
        <Route path="/users">
          <Shell>
            <UsersPage />
          </Shell>
        </Route>
        
        <Route path="/products">
          <Shell>
            <ProductsPage />
          </Shell>
        </Route>

        <Route path="/categories">
          <Shell>
            <CategoriesPage />
          </Shell>
        </Route>

        <Route path="/settings">
          <Shell>
            <SettingsPage />
          </Shell>
        </Route>

        <Route path="/reports">
          <Shell>
            <ReportsPage />
          </Shell>
        </Route>

        <Route path="/orders">
          <Shell>
            <OrdersPage />
          </Shell>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
