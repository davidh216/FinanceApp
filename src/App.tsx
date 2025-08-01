import React from 'react';
import './App.css';
import { FinancialProvider } from './contexts/FinancialContext';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  return (
    <FinancialProvider>
      <div className="App">
        <Dashboard />
      </div>
    </FinancialProvider>
  );
}

export default App;
