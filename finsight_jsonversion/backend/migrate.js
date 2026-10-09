/**
 * Legacy migration launcher redirecting to the complete Supabase Migration Engine.
 */
import { runFullMigration } from './scripts/migrate_all_data_to_supabase.js';

runFullMigration().then(res => {
  console.log('✅ Supabase Migration complete:', res);
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
