// public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Embrace Finance - Smart Financial Management Application"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>FinanceApp - Smart Financial Management</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>

---

// public/manifest.json
{
  "short_name": "FinanceApp",
  "name": "FinanceApp - Smart Financial Management",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}

---

// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

---

// src/App.tsx
import React from 'react';
import './App.css';
import EmbraceFinanceApp from './components/EmbraceFinanceApp';

function App() {
  return (
    <div className="App">
      <EmbraceFinanceApp />
    </div>
  );
}

export default App;

---

// src/index.css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}

---

// src/App.css
.App {
  text-align: left;
}

---

// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

---

// src/reportWebVitals.ts
import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

---

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

---

// src/components/EmbraceFinanceApp.tsx
// This is where your main FinanceApp component from the prototype will go
import React from 'react';

const EmbraceFinanceApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to FinanceApp!
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Your repository is set up and ready for development. 
          Replace this component with your financial management application.
        </p>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-left max-w-md">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✅ Repository created successfully</li>
            <li>✅ CI/CD pipeline configured</li>
            <li>✅ Development environment ready</li>
            <li>🔄 Add your financial components</li>
            <li>🔄 Configure deployment secrets</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmbraceFinanceApp;