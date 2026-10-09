import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://lsrcyhoxxbndzhntlvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing from environment. Check SUPABASE_URL and SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Storage Helper for Receipts and Documents
 */
export const storageHelper = {
  bucketName: 'receipts_documents',

  async uploadFile(filePath, fileBuffer, mimeType) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });
      if (error) throw error;
      return { success: true, path: data.path };
    } catch (err) {
      console.warn('[Storage] Upload note:', err.message);
      return { success: false, error: err.message };
    }
  },

  async createSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err) {
      console.warn('[Storage] Signed URL note:', err.message);
      return null;
    }
  }
};

export default supabase;
