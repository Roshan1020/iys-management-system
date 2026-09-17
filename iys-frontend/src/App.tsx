import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleGuard } from './components/guards/RoleGuard';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DevoteesListPage } from './pages/devotees/DevoteesListPage';
import { CentresListPage } from './pages/centres/CentresListPage';
import { UsersListPage } from './pages/users/UsersListPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Portal Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              {/* Devotees Directory */}
              <Route
                path="devotees"
                element={
                  <RoleGuard roles={['COUNSELLOR', 'CENTRE_ADMIN', 'SUPER_ADMIN']}>
                    <DevoteesListPage />
                  </RoleGuard>
                }
              />

              {/* Centres Administration */}
              <Route
                path="centres"
                element={
                  <RoleGuard roles={['SUPER_ADMIN', 'CENTRE_ADMIN']}>
                    <CentresListPage />
                  </RoleGuard>
                }
              />

              {/* Users & RBAC */}
              <Route
                path="users"
                element={
                  <RoleGuard roles={['SUPER_ADMIN', 'CENTRE_ADMIN']}>
                    <UsersListPage />
                  </RoleGuard>
                }
              />

              {/* Super Admin Hub */}
              <Route
                path="super-admin"
                element={
                  <RoleGuard roles={['SUPER_ADMIN']}>
                    <SuperAdminPage />
                  </RoleGuard>
                }
              />

              {/* My Profile */}
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
