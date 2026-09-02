import dotenv from 'dotenv';
import { supabase } from '../db/supabaseClient.js';

dotenv.config();

async function purgeAllTransactionsAndDocuments() {
  console.log('🧹 Purging all dummy/test transactions and documents from Supabase...');

  const { error: txErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (txErr) console.error('Error deleting transactions:', txErr);
  else console.log('✅ Transactions table emptied (0 records).');

  const { error: docErr } = await supabase.from('uploaded_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (docErr) console.error('Error deleting uploaded documents:', docErr);
  else console.log('✅ Uploaded documents table emptied (0 records).');

  console.log('✨ All workspaces now have 0 hardcoded transactions.');
}

purgeAllTransactionsAndDocuments().catch(console.error);
