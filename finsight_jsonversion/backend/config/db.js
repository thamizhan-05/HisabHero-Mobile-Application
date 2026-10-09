import { supabase } from '../db/supabaseClient.js';
import { logger } from '../utils/logger.js';

export let isSupabaseConnected = true;

export const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (!error) {
      logger.info('📡 Supabase PostgreSQL Connected Successfully.');
      isSupabaseConnected = true;
      return true;
    } else {
      logger.warn(`⚠️ Supabase connection status: ${error.message}`);
      isSupabaseConnected = false;
      return false;
    }
  } catch (err) {
    logger.warn(`⚠️ Supabase connection error: ${err.message}`);
    isSupabaseConnected = false;
    return false;
  }
};

export default checkDatabaseConnection;
