import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { currentUser, loading } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCheckingDemoMode, setIsCheckingDemoMode] = useState(true);

  // Check for demo mode on component mount
  useEffect(() => {
    const checkDemoMode = () => {
      // Check if demo mode was activated from login
      const demoMode = localStorage.getItem('financeapp-demo-mode');
      const urlParams = new URLSearchParams(window.location.search);
      const demoParam = urlParams.get('demo');
      
      if (demoMode === 'true' || demoParam === 'true') {
        setIsDemoMode(true);
        // Clear the demo flag from localStorage after reading
        localStorage.removeItem('financeapp-demo-mode');
      }
      setIsCheckingDemoMode(false);
    };

    checkDemoMode();
  }, []);

  // Show loading while checking demo mode
  if (isCheckingDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if in demo mode
  if (isDemoMode) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access this page
          </p>
          <div className="max-w-md mx-auto">
            {/* LoginForm will be rendered here by the parent component */}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 