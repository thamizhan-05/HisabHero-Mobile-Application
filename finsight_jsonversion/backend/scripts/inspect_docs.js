import dotenv from 'dotenv';
import { supabase } from '../db/supabaseClient.js';

dotenv.config();

async function checkDocs() {
  console.log('🔍 Checking Supabase uploaded_documents...');
  const { data: docs, error: docErr } = await supabase.from('uploaded_documents').select('*');
  console.log('Docs Error:', docErr?.message);
  console.log('Docs Count:', docs?.length);
  console.log('Docs:', docs);

  const { data: txs, error: txErr } = await supabase.from('transactions').select('*');
  console.log('Transactions Count:', txs?.length);
}

checkDocs().catch(console.error);
