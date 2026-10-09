import app from './app.js';
import { config } from './config/env.js';
import { supabase } from './db/supabaseClient.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

// ─── START SERVER ───
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 HisabHero Platform running on http://localhost:${PORT}`);
  logger.info(`⚙️  Environment: ${config.nodeEnv}`);

  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (!error) {
      logger.info(`📡 Supabase PostgreSQL Connected: ${config.supabaseUrl}`);
    } else {
      logger.warn(`⚠️ Supabase connection status: ${error.message}`);
    }
  } catch (e) {
    logger.warn(`⚠️ Supabase initialization: ${e.message}`);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

export default app;
