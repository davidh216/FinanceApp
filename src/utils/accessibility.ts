// Accessibility utilities for WCAG 2.1 AA compliance

export interface AccessibilityConfig {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
}

// Accessibility context for managing global accessibility settings
export interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  currentTheme: 'light' | 'dark' | 'high-contrast';
}

// High contrast mode detection
export const useHighContrast = (): boolean => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return reducedMotion;
};

// Keyboard navigation utilities
export const useKeyboardNavigation = () => {
  const handleKeyDown = React.useCallback((event: KeyboardEvent, handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handlers.onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        handlers.onEscape?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        handlers.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        handlers.onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlers.onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handlers.onArrowRight?.();
        break;
      case 'Tab':
        handlers.onTab?.();
        break;
    }
  }, []);

  return { handleKeyDown };
};

// Focus management utilities
export const useFocusManagement = () => {
  const focusableElements = React.useRef<HTMLElement[]>([]);
  
  const setFocusableElements = React.useCallback((elements: HTMLElement[]) => {
    focusableElements.current = elements;
  }, []);
  
  const focusFirst = React.useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[0].focus();
    }
  }, []);
  
  const focusLast = React.useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[focusableElements.current.length - 1].focus();
    }
  }, []);
  
  const focusNext = React.useCallback(() => {
    const currentIndex = focusableElements.current.findIndex(el => el === document.activeElement);
    if (currentIndex >= 0 && currentIndex < focusableElements.current.length - 1) {
      focusableElements.current[currentIndex + 1].focus();
    }
  }, []);
  
  const focusPrevious = React.useCallback(() => {
    const currentIndex = focusableElements.current.findIndex(el => el === document.activeElement);
    if (currentIndex > 0) {
      focusableElements.current[currentIndex - 1].focus();
    }
  }, []);
  
  return {
    setFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
};

// ARIA utilities
export const getAriaLabel = (element: string, context?: string): string => {
  const baseLabels: Record<string, string> = {
    'chart': 'Chart visualization',
    'button': 'Button',
    'input': 'Input field',
    'select': 'Dropdown selection',
    'table': 'Data table',
    'navigation': 'Navigation menu',
    'main': 'Main content area',
    'aside': 'Sidebar content',
    'footer': 'Page footer',
  };
  
  const baseLabel = baseLabels[element] || element;
  return context ? `${baseLabel} for ${context}` : baseLabel;
};

export const getAriaDescribedBy = (description: string): string => {
  return `description-${Math.random().toString(36).substr(2, 9)}`;
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      if (c <= 0.03928) {
        return c / 12.92;
      }
      return Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const isAccessibleContrast = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

// Enhanced screen reader announcement with queue management
class ScreenReaderAnnouncer {
  private queue: Array<{ message: string; priority: 'polite' | 'assertive' }> = [];
  private isAnnouncing = false;

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.queue.push({ message, priority });
    if (!this.isAnnouncing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isAnnouncing = false;
      return;
    }

    this.isAnnouncing = true;
    const { message, priority } = this.queue.shift()!;
    
    announceToScreenReader(message, priority);
    
    // Wait before processing next announcement
    setTimeout(() => {
      this.processQueue();
    }, 1500);
  }
}

export const screenReaderAnnouncer = new ScreenReaderAnnouncer();

// Skip link utilities
export const createSkipLink = (targetId: string, text: string): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  return skipLink;
};

// Form accessibility utilities
export const getFormFieldAriaProps = (
  id: string,
  label: string,
  required: boolean = false,
  error?: string,
  description?: string
) => {
  const props: Record<string, string> = {
    id,
    'aria-labelledby': `${id}-label`,
    'aria-describedby': [description && `${id}-description`, error && `${id}-error`]
      .filter(Boolean)
      .join(' '),
  };
  
  if (required) {
    props['aria-required'] = 'true';
  }
  
  if (error) {
    props['aria-invalid'] = 'true';
  }
  
  return props;
};

// Chart accessibility utilities
export const getChartAriaProps = (
  chartType: string,
  dataPoints: number,
  title?: string
) => {
  return {
    role: 'img',
    'aria-label': `${chartType} chart showing ${dataPoints} data points${title ? ` for ${title}` : ''}`,
    tabIndex: 0,
  };
};

// Animation utilities for reduced motion
export const getReducedMotionStyles = (reducedMotion: boolean) => {
  if (reducedMotion) {
    return {
      transition: 'none',
      animation: 'none',
    };
  }
  return {};
};

// High contrast mode styles
export const getHighContrastStyles = (highContrast: boolean) => {
  if (highContrast) {
    return {
      border: '2px solid',
      backgroundColor: 'transparent',
    };
  }
  return {};
};

// WCAG 2.1 AA compliance utilities
export const validateWCAGCompliance = () => {
  const issues: string[] = [];
  
  // Check for proper heading structure
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
  
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      issues.push(`Heading level skipped: ${headingLevels[i - 1]} to ${headingLevels[i]}`);
    }
  }
  
  // Check for proper alt text on images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image missing alt attribute: ${img.src}`);
    }
  });
  
  // Check for proper form labels
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    if (id && !document.querySelector(`label[for="${id}"]`)) {
      issues.push(`Input missing label: ${id}`);
    }
  });
  
  return issues;
};

// Keyboard navigation enhancement
export const createKeyboardNavigableList = (
  items: HTMLElement[],
  onSelect?: (index: number) => void
) => {
  let currentIndex = -1;
  
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items[currentIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && onSelect) {
          onSelect(currentIndex);
        }
        break;
      case 'Home':
        event.preventDefault();
        currentIndex = 0;
        items[currentIndex]?.focus();
        break;
      case 'End':
        event.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex]?.focus();
        break;
    }
  };
  
  return { handleKeyDown, setCurrentIndex: (index: number) => { currentIndex = index; } };
};

// Export React for use in hooks
import React from 'react'; 