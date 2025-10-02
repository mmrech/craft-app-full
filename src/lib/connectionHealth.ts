import { supabase } from '@/integrations/supabase/client';

export interface ConnectionStatus {
  database: boolean;
  storage: boolean;
  overall: boolean;
  lastChecked: Date;
  error?: string;
}

/**
 * Check if Supabase database is accessible
 */
export const testDatabaseAccess = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clinical_extractions')
      .select('id')
      .limit(1);
    return !error;
  } catch (error) {
    console.error('Database access test failed:', error);
    return false;
  }
};

/**
 * Check if Supabase storage is accessible
 */
export const testStorageAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .storage
      .getBucket('pdf_documents');
    return !error && data !== null;
  } catch (error) {
    console.error('Storage access test failed:', error);
    return false;
  }
};

/**
 * Comprehensive connection health check
 */
export const checkSupabaseConnection = async (): Promise<ConnectionStatus> => {
  const status: ConnectionStatus = {
    database: false,
    storage: false,
    overall: false,
    lastChecked: new Date(),
  };

  try {
    // Test database connection
    status.database = await testDatabaseAccess();
    
    // Test storage connection
    status.storage = await testStorageAccess();
    
    // Overall status is true if both are accessible
    status.overall = status.database && status.storage;
    
    if (!status.overall) {
      status.error = `Connection issues: ${
        !status.database ? 'Database unavailable. ' : ''
      }${
        !status.storage ? 'Storage unavailable.' : ''
      }`;
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('Connection health check failed:', error);
  }

  return status;
};

/**
 * Get current connection status with caching
 */
let cachedStatus: ConnectionStatus | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const getConnectionStatus = async (forceRefresh = false): Promise<ConnectionStatus> => {
  const now = Date.now();
  
  if (!forceRefresh && cachedStatus && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedStatus;
  }
  
  cachedStatus = await checkSupabaseConnection();
  lastCheckTime = now;
  
  return cachedStatus;
};
