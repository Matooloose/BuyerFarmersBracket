import { useState, useEffect } from "react";
import { Network } from '@capacitor/network';
import type { PluginListenerHandle } from '@capacitor/core';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      const status = await Network.getStatus();
      if (mounted) setIsOnline(status.connected);
    };
    checkStatus();
    let handler: PluginListenerHandle | undefined;
    const setupListener = async () => {
      handler = await Network.addListener('networkStatusChange', status => {
        if (mounted) setIsOnline(status.connected);
      });
    };
    setupListener();
    return () => {
      mounted = false;
      if (handler) handler.remove();
    };
  }, []);

  return isOnline;
}
