import React, { useState, useEffect } from 'react';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';

interface ThemeToggleProps {
  className?: string;
}

type Theme = 'light' | 'dark' | 'high-contrast';

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('finance-app-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    
    // Add new theme class
    root.classList.add(`theme-${newTheme}`);
    
    // Apply theme-specific styles
    switch (newTheme) {
      case 'dark':
        root.style.setProperty('--bg-primary', '#1f2937');
        root.style.setProperty('--bg-secondary', '#374151');
        root.style.setProperty('--text-primary', '#f9fafb');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--border-color', '#4b5563');
        break;
      case 'high-contrast':
        root.style.setProperty('--bg-primary', '#000000');
        root.style.setProperty('--bg-secondary', '#ffffff');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#000000');
        root.style.setProperty('--border-color', '#ffffff');
        break;
      default: // light
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f9fafb');
        root.style.setProperty('--text-primary', '#1f2937');
        root.style.setProperty('--text-secondary', '#6b7280');
        root.style.setProperty('--border-color', '#e5e7eb');
    }
    
    // Save to localStorage
    localStorage.setItem('finance-app-theme', newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'high-contrast':
        return <Eye className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'dark':
        return 'Dark Mode';
      case 'high-contrast':
        return 'High Contrast';
      default:
        return 'Light Mode';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getThemeIcon(theme)}
        <span>Theme</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {(['light', 'dark', 'high-contrast'] as Theme[]).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === themeOption ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                }`}
                aria-label={`Switch to ${getThemeLabel(themeOption)}`}
              >
                {getThemeIcon(themeOption)}
                <span>{getThemeLabel(themeOption)}</span>
                {theme === themeOption && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// CSS Variables for theme support
const themeStyles = `
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
  }

  .theme-dark {
    --bg-primary: #1f2937;
    --bg-secondary: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-color: #4b5563;
  }

  .theme-high-contrast {
    --bg-primary: #000000;
    --bg-secondary: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #000000;
    --border-color: #ffffff;
  }

  /* Apply theme variables to common elements */
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .bg-white {
    background-color: var(--bg-primary);
  }

  .bg-gray-50 {
    background-color: var(--bg-secondary);
  }

  .text-gray-900 {
    color: var(--text-primary);
  }

  .text-gray-600 {
    color: var(--text-secondary);
  }

  .border-gray-200 {
    border-color: var(--border-color);
  }

  /* High contrast specific styles */
  .theme-high-contrast * {
    border-width: 2px !important;
  }

  .theme-high-contrast button,
  .theme-high-contrast input,
  .theme-high-contrast select {
    border: 2px solid var(--border-color) !important;
  }

  .theme-high-contrast .focus\\:ring-2:focus {
    box-shadow: 0 0 0 4px var(--border-color) !important;
  }
`;

// Inject theme styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = themeStyles;
  document.head.appendChild(style);
} 