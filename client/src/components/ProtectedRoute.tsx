import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Role } from '../types/index.js';
import { LoadingSpinner } from './LoadingSpinner.js';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating FarmFleet session..." />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard based on actual role
    if (role === 'ADMIN' || role === 'CHC_MANAGER') {
      return <Navigate to="/chc/dashboard" replace />;
    } else if (role === 'OPERATOR') {
      return <Navigate to="/operator/dashboard" replace />;
    } else if (role === 'FARMER') {
      return <Navigate to="/farmer/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};
