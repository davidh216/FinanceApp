import React, { useState } from 'react';
import { LoginForm } from './LoginForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleAuthSuccess = () => {
    // Redirect to dashboard or home page
    window.location.href = '/';
  };

  const handleTryDemo = () => {
    setIsDemoMode(true);
    // Set demo mode flag in localStorage
    localStorage.setItem('financeapp-demo-mode', 'true');
    // Redirect to dashboard in demo mode
    window.location.href = '/';
  };

  // If in demo mode, show a message that demo is active
  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4">
            <span className="text-6xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Mode Activated
          </h1>
          <p className="text-gray-600 mb-8">
            Redirecting to dashboard with demo data...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            FinanceApp
          </h1>
          <p className="text-gray-600">
            Smart Financial Management
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={handleSwitchToRegister}
            onTryDemo={handleTryDemo}
          />
        ) : (
          <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-600">
                Email/password registration will be available soon
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  For now, please use Google Sign-In to create your account.
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={handleSwitchToLogin}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 FinanceApp. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}; 