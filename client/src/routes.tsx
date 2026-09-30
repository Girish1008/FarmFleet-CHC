import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Layout } from './components/Layout.js';

// Pages
import { LoginPage } from './pages/login.js';
import { ChcDashboardPage } from './pages/chc/dashboard.js';
import { BookingsListPage } from './pages/chc/bookings/list.js';
import { NewBookingPage } from './pages/chc/bookings/new.js';
import { BookingDetailsPage } from './pages/chc/bookings/details.js';
import { SchedulePage } from './pages/chc/schedule.js';
import { ChcTrackingListPage } from './pages/chc/tracking/index.js';
import { ChcTrackingDetailPage } from './pages/chc/tracking/detail.js';

import { FarmerDashboardPage } from './pages/farmer/dashboard.js';
import { NewFarmerRequestPage } from './pages/farmer/requests/new.js';
import { FarmerRequestsListPage } from './pages/farmer/requests/list.js';
import { FarmerRequestDetailPage } from './pages/farmer/requests/detail.js';
import { FarmerBookingsListPage } from './pages/farmer/bookings/list.js';
import { FarmerBookingDetailPage } from './pages/farmer/bookings/detail.js';

import { OperatorDashboardPage } from './pages/operator/dashboard.js';
import { OperatorJobDetailPage } from './pages/operator/jobs/detail.js';
import { OperatorTrackingPage } from './pages/operator/tracking.js';

export const AppRoutes: React.FC = () => {
  const { role, user } = useAuth();

  // Root redirector based on authenticated user's role
  const RootRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (role === 'ADMIN' || role === 'CHC_MANAGER') return <Navigate to="/chc/dashboard" replace />;
    if (role === 'OPERATOR') return <Navigate to="/operator/dashboard" replace />;
    if (role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        {/* CHC Module (Admin / CHC Manager) */}
        <Route
          path="/chc/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <ChcDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/bookings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <BookingsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/bookings/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <NewBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/bookings/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <BookingDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/schedule"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/tracking"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <ChcTrackingListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chc/tracking/:bookingId"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CHC_MANAGER']}>
              <ChcTrackingDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Farmer Module */}
        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/requests"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerRequestsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/requests/new"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <NewFarmerRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/requests/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerRequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/bookings"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerBookingsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/bookings/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerBookingDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Operator Module */}
        <Route
          path="/operator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN', 'CHC_MANAGER']}>
              <OperatorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN', 'CHC_MANAGER']}>
              <OperatorJobDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/tracking"
          element={
            <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN', 'CHC_MANAGER']}>
              <OperatorTrackingPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
