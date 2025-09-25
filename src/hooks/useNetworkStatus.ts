import { useState, useEffect } from "react";

// Change this to a reliable backend endpoint (e.g., your Supabase REST endpoint or /api/health)
const TEST_URL = "https://iuhitcjimtdjffdumptw.supabase.co/rest/v1/?select=1";

export function useNetworkStatus(pingUrl: string = TEST_URL, interval: number = 5000) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkOnline = async () => {
      try {
        // Use a public endpoint for reliable online check
        const response = await fetch('https://www.google.com/generate_204', { method: 'GET', cache: 'no-store' });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    // Listen to browser events
    const handleOnline = () => checkOnline();
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkOnline();
    // Poll every interval
    timer = setInterval(checkOnline, interval);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(timer);
    };
  }, [pingUrl, interval]);

  return isOnline;
}
