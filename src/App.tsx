import React from 'react';
import './App.css';
import { FinancialProvider } from './contexts/FinancialContext';
import { FileSyncProvider } from './contexts/FileSyncContext';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  return (
    <FinancialProvider>
      <FileSyncProvider>
        <div className="App">
          <Dashboard />
        </div>
      </FileSyncProvider>
    </FinancialProvider>
  );
}

export default App;
