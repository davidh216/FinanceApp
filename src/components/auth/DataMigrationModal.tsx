import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDataMigration } from '../../utils/dataMigration';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { currentUser } = useAuth();
  const [hasExistingData, setHasExistingData] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    migrationProgress,
    isMigrating,
    startMigration,
    checkExistingData,
    getStats,
  } = useDataMigration(currentUser?.id || '');

  useEffect(() => {
    if (isOpen && currentUser) {
      loadMigrationData();
    }
  }, [isOpen, currentUser]);

  const loadMigrationData = async () => {
    try {
      const existingData = await checkExistingData();
      setHasExistingData(existingData);

      const migrationStats = await getStats();
      setStats(migrationStats);
    } catch (error) {
      console.error('Error loading migration data:', error);
    }
  };

  const handleStartMigration = () => {
    setShowConfirmation(true);
  };

  const handleConfirmMigration = async () => {
    setShowConfirmation(false);
    await startMigration();
  };

  const handleCancelMigration = () => {
    setShowConfirmation(false);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Data Migration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {hasExistingData === null ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Checking existing data...</p>
            </div>
          ) : hasExistingData ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Data Already Migrated
              </h3>
              <p className="text-gray-600 mb-6">
                Your data has already been migrated to Firebase. You're all set!
              </p>
              {stats && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Accounts</p>
                      <p className="font-semibold">{stats.firebaseAccounts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transactions</p>
                      <p className="font-semibold">{stats.firebaseTransactions}</p>
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={handleComplete} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to Firebase!
                </h3>
                <p className="text-gray-600 mb-4">
                  To get started with real-time data synchronization, we need to migrate your sample data to Firebase.
                </p>
                {stats && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Migration Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Sample Accounts</p>
                        <p className="font-semibold text-blue-900">{stats.mockAccounts}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Sample Transactions</p>
                        <p className="font-semibold text-blue-900">{stats.mockTransactions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {migrationProgress.status === 'idle' && !showConfirmation && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      This will create sample accounts and transactions in your Firebase database for demonstration purposes.
                    </p>
                  </div>
                  <Button onClick={handleStartMigration} className="w-full">
                    Start Migration
                  </Button>
                </div>
              )}

              {showConfirmation && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm font-semibold mb-2">
                      Confirm Migration
                    </p>
                    <p className="text-yellow-800 text-sm">
                      This will migrate {stats?.mockAccounts} accounts and {stats?.mockTransactions} transactions to your Firebase database. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={handleConfirmMigration} className="flex-1">
                      Confirm
                    </Button>
                    <Button onClick={handleCancelMigration} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {migrationProgress.status === 'migrating' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Migrating data to Firebase...</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Accounts: {migrationProgress.accounts}/{migrationProgress.totalAccounts}</span>
                      <span>{Math.round((migrationProgress.accounts / migrationProgress.totalAccounts) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(migrationProgress.accounts / migrationProgress.totalAccounts) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Transactions: {migrationProgress.transactions}/{migrationProgress.totalTransactions}</span>
                      <span>{Math.round((migrationProgress.transactions / migrationProgress.totalTransactions) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(migrationProgress.transactions / migrationProgress.totalTransactions) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {migrationProgress.status === 'completed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Migration Complete!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Successfully migrated {migrationProgress.accounts} accounts and {migrationProgress.transactions} transactions.
                  </p>
                  <Button onClick={handleComplete} className="w-full">
                    Continue to Dashboard
                  </Button>
                </div>
              )}

              {migrationProgress.status === 'error' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Migration Failed
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {migrationProgress.error || 'An error occurred during migration.'}
                  </p>
                  <div className="flex space-x-3">
                    <Button onClick={handleStartMigration} className="flex-1">
                      Try Again
                    </Button>
                    <Button onClick={onClose} variant="outline" className="flex-1">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 