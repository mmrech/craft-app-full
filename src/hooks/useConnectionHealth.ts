import { useState, useEffect, useCallback } from 'react';
import { getConnectionStatus, type ConnectionStatus } from '@/lib/connectionHealth';

interface UseConnectionHealthOptions {
  checkInterval?: number; // milliseconds between checks
  autoCheck?: boolean; // automatically check on mount and interval
}

export const useConnectionHealth = (options: UseConnectionHealthOptions = {}) => {
  const { checkInterval = 60000, autoCheck = true } = options; // Default: check every 60 seconds
  
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async (forceRefresh = false) => {
    setIsChecking(true);
    setError(null);
    
    try {
      const connectionStatus = await getConnectionStatus(forceRefresh);
      setStatus(connectionStatus);
      
      if (!connectionStatus.overall && connectionStatus.error) {
        setError(connectionStatus.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check connection';
      setError(errorMessage);
      console.error('Connection health check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    checkConnection(true);

    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      checkConnection(false); // Use cached status if available
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [autoCheck, checkInterval, checkConnection]);

  return {
    status,
    isChecking,
    error,
    checkConnection,
    isConnected: status?.overall ?? false,
    isDatabaseConnected: status?.database ?? false,
    isStorageConnected: status?.storage ?? false,
  };
};
