import React, { Suspense, useEffect } from 'react';
import './App.css';
import { FinancialProvider } from './contexts/FinancialContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullScreenSpinner } from './components/ui/LoadingSpinner';
import { ProtectedRoute, AuthPage } from './components/auth';
import { registerServiceWorker, addOnlineListener, addOfflineListener } from './utils/serviceWorker';

// Lazy load components for code splitting
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));

function App() {
  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
    
    // Add online/offline listeners
    const handleOnline = () => {
      console.log('App is online');
      // You can trigger data sync here
    };
    
    const handleOffline = () => {
      console.log('App is offline');
      // You can show offline indicator here
    };
    
    addOnlineListener(handleOnline);
    addOfflineListener(handleOffline);
    
    // Cleanup listeners
    return () => {
      addOnlineListener(handleOnline);
      addOfflineListener(handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinancialProvider>
          <ProtectedRoute fallback={<AuthPage />}>
            <Suspense fallback={<FullScreenSpinner text="Loading Dashboard..." />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        </FinancialProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
