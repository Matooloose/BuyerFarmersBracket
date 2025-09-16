import { useEffect } from 'react';

export const useStatusBar = () => {
  useEffect(() => {
    // Set status bar style for mobile app
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      // App is running in standalone mode (mobile app)
      document.documentElement.style.setProperty('--status-bar-height', 'env(safe-area-inset-top)');
    }
  }, []);
};