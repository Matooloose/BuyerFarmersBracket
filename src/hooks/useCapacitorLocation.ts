import { useState, useEffect } from "react";
import { Geolocation } from '@capacitor/geolocation';

export function useCapacitorLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const getLocation = async () => {
      try {
        const pos = await Geolocation.getCurrentPosition();
        if (mounted) setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (err: any) {
        if (mounted) setError(err.message || 'Location unavailable');
      }
    };
    getLocation();
    return () => { mounted = false; };
  }, []);

  return { location, error };
}
