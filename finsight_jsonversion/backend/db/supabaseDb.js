/**
 * HISABHERO RESILIENT SUPABASE DATA ACCESS LAYER (DAL)
 * Features automatic failover to local persistent JSON database
 * when Supabase network/DNS is unreachable.
 */

import { supabase } from './supabaseClient.js';
import { localDb } from './localDb.js';

let isSupabaseOffline = false;

// Universal Safe Executor with instant local fallback
async function safeDb(supabaseFn, localDbFn) {
  if (isSupabaseOffline) {
    return localDbFn();
  }
  try {
    return await supabaseFn();
  } catch (err) {
    const msg = String(err?.message || '');
    if (
      msg.includes('fetch failed') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('timeout') ||
      msg.includes('Failed to fetch') ||
      msg.includes('ConnectTimeoutError') ||
      msg.includes('ECONNREFUSED')
    ) {
      if (!isSupabaseOffline) {
        console.warn('⚠️ Supabase network unreachable (' + msg + '). Activating resilient local JSON database.');
        isSupabaseOffline = true;
      }
      return localDbFn();
    }
    throw err;
  }
}

// ─── HELPER: UUID / ID NORMALIZER ───
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// ─── 1. USERS REPOSITORY ─────────────────────────────────────────────────────
export const usersRepo = {
  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (error) throw new Error(`[usersRepo.findByEmail] ${error.message}`);
        if (!data) return null;

        return {
          _id: data.id,
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          passwordHash: data.password,
          role: data.role || 'owner',
          accountType: data.account_type || 'personal',
          isVerified: data.is_verified ?? true,
          authProviders: data.auth_providers || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      },
      () => localDb.findUserByEmail(cleanEmail)
    );
  },

  async findById(id) {
    if (!id) return null;

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(`[usersRepo.findById] ${error.message}`);
        if (!data) return null;

        return {
          _id: data.id,
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          passwordHash: data.password,
          role: data.role || 'owner',
          accountType: data.account_type || 'personal',
          isVerified: data.is_verified ?? true,
          authProviders: data.auth_providers || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      },
      () => localDb.findUserById(id)
    );
  },

  async create({ email, fullName, password, role = 'owner', accountType = 'personal', isVerified = true, authProviders = [] }) {
    const cleanEmail = email.trim().toLowerCase();

    return safeDb(
      async () => {
        const payload = {
          email: cleanEmail,
          full_name: fullName,
          password,
          role,
          account_type: accountType,
          is_verified: isVerified,
          email_verified: isVerified,
          auth_providers: authProviders
        };

        const { data, error } = await supabase
          .from('users')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[usersRepo.create] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          passwordHash: data.password,
          role: data.role,
          accountType: data.account_type,
          isVerified: data.is_verified,
          createdAt: data.created_at
        };
      },
      () => localDb.createUser({ email: cleanEmail, fullName, password, role, accountType, isVerified, authProviders })
    );
  },

  async update(id, updates) {
    return safeDb(
      async () => {
        const payload = { updated_at: new Date().toISOString() };
        if (updates.fullName !== undefined) payload.full_name = updates.fullName;
        if (updates.password !== undefined) payload.password = updates.password;
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.isVerified !== undefined) {
          payload.is_verified = updates.isVerified;
          payload.email_verified = updates.isVerified;
        }
        if (updates.accountType !== undefined) payload.account_type = updates.accountType;

        const { data, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(`[usersRepo.update] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          isVerified: data.is_verified
        };
      },
      () => localDb.updateUser(id, updates)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw new Error(`[usersRepo.delete] ${error.message}`);
        return true;
      },
      () => {
        localDb.data.users = localDb.data.users.filter(u => u.id !== id && u._id !== id);
        localDb.save();
        return true;
      }
    );
  }
};

// ─── 2. WORKSPACES REPOSITORY ────────────────────────────────────────────────
export const workspacesRepo = {
  async findById(id) {
    if (!id) return null;

    return safeDb(
      async () => {
        if (!isValidUUID(id)) return localDb.findWorkspaceById(id);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(`[workspacesRepo.findById] ${error.message}`);
        if (!data) return localDb.findWorkspaceById(id);

        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          type: data.type || 'personal',
          ownerId: data.owner_id,
          businessName: data.business_name,
          industry: data.industry,
          currency: data.currency || 'INR',
          joinCode: data.join_code,
          cashBalance: Number(data.cash_balance || 0),
          settings: data.settings || {},
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      },
      () => localDb.findWorkspaceById(id)
    );
  },

  async findByOwnerId(ownerId) {
    if (!ownerId) return [];

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: true });

        if (error) throw new Error(`[workspacesRepo.findByOwnerId] ${error.message}`);
        return (data || []).map(w => ({
          _id: w.id,
          id: w.id,
          name: w.name,
          type: w.type,
          ownerId: w.owner_id,
          businessName: w.business_name,
          industry: w.industry,
          currency: w.currency,
          joinCode: w.join_code,
          cashBalance: Number(w.cash_balance || 0),
          settings: w.settings,
          createdAt: w.created_at
        }));
      },
      () => localDb.findWorkspacesByOwner(ownerId)
    );
  },

  async findByJoinCode(joinCode) {
    if (!joinCode) return null;
    const cleanCode = joinCode.trim().toUpperCase();

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('join_code', cleanCode)
          .maybeSingle();

        if (error) throw new Error(`[workspacesRepo.findByJoinCode] ${error.message}`);
        if (!data) return null;

        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          type: data.type,
          ownerId: data.owner_id,
          joinCode: data.join_code
        };
      },
      () => localDb.data.workspaces.find(w => w.join_code === cleanCode || w.joinCode === cleanCode) || null
    );
  },

  async create({ name, type = 'personal', ownerId, businessName, industry, currency = 'INR', joinCode, settings = {} }) {
    return safeDb(
      async () => {
        const payload = {
          name,
          type,
          owner_id: ownerId,
          business_name: businessName || (type === 'business' ? name : null),
          industry: industry || null,
          currency,
          join_code: joinCode,
          settings: {
            currency: 'INR',
            currencySymbol: '₹',
            allowNegativeBalance: true,
            taxEnabled: true,
            startingBalance: 0,
            ...settings
          }
        };

        const { data, error } = await supabase
          .from('workspaces')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[workspacesRepo.create] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          type: data.type,
          ownerId: data.owner_id,
          businessName: data.business_name,
          industry: data.industry,
          currency: data.currency,
          joinCode: data.join_code,
          settings: data.settings,
          createdAt: data.created_at
        };
      },
      () => localDb.createWorkspace({ name, type, ownerId, businessName, industry, currency, joinCode, settings })
    );
  },

  async update(id, updates) {
    return safeDb(
      async () => {
        const payload = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.businessName !== undefined) payload.business_name = updates.businessName;
        if (updates.industry !== undefined) payload.industry = updates.industry;
        if (updates.settings !== undefined) payload.settings = updates.settings;
        if (updates.cashBalance !== undefined) payload.cash_balance = updates.cashBalance;

        const { data, error } = await supabase
          .from('workspaces')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(`[workspacesRepo.update] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          type: data.type,
          settings: data.settings
        };
      },
      () => {
        const ws = localDb.findWorkspaceById(id);
        if (ws) {
          if (updates.name !== undefined) ws.name = updates.name;
          if (updates.cashBalance !== undefined) ws.cash_balance = updates.cashBalance;
          localDb.save();
        }
        return ws;
      }
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('workspaces').delete().eq('id', id);
        if (error) throw new Error(`[workspacesRepo.delete] ${error.message}`);
        return true;
      },
      () => {
        localDb.data.workspaces = localDb.data.workspaces.filter(w => w.id !== id && w._id !== id);
        localDb.save();
        return true;
      }
    );
  },

  async resetData(workspaceId) {
    return safeDb(
      async () => {
        await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
        await supabase.from('uploaded_documents').delete().eq('workspace_id', workspaceId);
        return true;
      },
      () => localDb.resetWorkspaceData(workspaceId)
    );
  },

  async getUserWorkspaces(userId) {
    return safeDb(
      async () => {
        const owned = await this.findByOwnerId(userId);
        return owned;
      },
      () => localDb.findWorkspacesByOwner(userId)
    );
  }
};

// ─── 3. TRANSACTIONS REPOSITORY ──────────────────────────────────────────────
export const transactionsRepo = {
  async create(tx) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: tx.workspaceId,
          user_id: tx.userId || null,
          type: tx.type || 'expense',
          category: tx.category || 'General',
          amount: Number(tx.amount || 0),
          description: tx.description || 'Transaction',
          merchant: tx.merchant || null,
          date: tx.date || new Date().toISOString().split('T')[0],
          payment_method: tx.paymentMethod || 'Cash',
          source: tx.source || 'Manual',
          tax_rate: Number(tx.taxRate || 0),
          tax_amount: Number(tx.taxAmount || 0),
          is_verified: tx.isVerified ?? true,
          metadata: tx.metadata || {}
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[transactionsRepo.create] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          workspaceId: data.workspace_id,
          userId: data.user_id,
          type: data.type,
          category: data.category,
          amount: Number(data.amount),
          description: data.description,
          merchant: data.merchant,
          date: data.date,
          paymentMethod: data.payment_method,
          taxAmount: Number(data.tax_amount || 0),
          createdAt: data.created_at
        };
      },
      () => localDb.createTransaction(tx)
    );
  },

  async createBatch(txList) {
    if (!Array.isArray(txList) || txList.length === 0) return [];

    return safeDb(
      async () => {
        const payloads = txList.map(tx => ({
          workspace_id: tx.workspaceId,
          user_id: tx.userId || null,
          type: tx.type || 'expense',
          category: tx.category || 'General',
          amount: Number(tx.amount || 0),
          description: tx.description || 'Transaction',
          merchant: tx.merchant || null,
          date: tx.date || new Date().toISOString().split('T')[0],
          payment_method: tx.paymentMethod || 'Cash',
          source: tx.source || 'Statement Parser',
          tax_rate: Number(tx.taxRate || 0),
          tax_amount: Number(tx.taxAmount || 0),
          is_verified: true,
          metadata: tx.metadata || {}
        }));

        const { data, error } = await supabase
          .from('transactions')
          .insert(payloads)
          .select();

        if (error) throw new Error(`[transactionsRepo.createBatch] ${error.message}`);
        return (data || []).map(d => ({
          _id: d.id,
          id: d.id,
          workspaceId: d.workspace_id,
          userId: d.user_id,
          type: d.type,
          category: d.category,
          amount: Number(d.amount),
          description: d.description,
          date: d.date,
          createdAt: d.created_at
        }));
      },
      () => localDb.createTransactionsBatch(txList)
    );
  },

  async listByWorkspace(workspaceId, { limit = 500, offset = 0, type, category } = {}) {
    return safeDb(
      async () => {
        if (!workspaceId) return [];

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (type) query = query.eq('type', type);
        if (category) query = query.eq('category', category);

        const { data, error } = await query;
        if (error) throw new Error(`[transactionsRepo.listByWorkspace] ${error.message}`);

        return (data || []).map(d => ({
          _id: d.id,
          id: d.id,
          workspaceId: d.workspace_id,
          userId: d.user_id,
          type: d.type,
          category: d.category,
          amount: Number(d.amount),
          description: d.description,
          merchant: d.merchant,
          date: d.date,
          paymentMethod: d.payment_method,
          taxAmount: Number(d.tax_amount || 0),
          createdAt: d.created_at
        }));
      },
      () => localDb.listTransactions(workspaceId, { type, category })
    );
  },

  async getMetrics(workspaceId) {
    const txs = await this.listByWorkspace(workspaceId, { limit: 10000 });
    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryBreakdown = {};

    for (const tx of txs) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
        const cat = tx.category || 'General';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    }

    return {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      count: txs.length,
      categoryBreakdown
    };
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw new Error(`[transactionsRepo.delete] ${error.message}`);
        return true;
      },
      () => localDb.deleteTransaction(id)
    );
  },

  async deleteByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
        if (error) throw new Error(`[transactionsRepo.deleteByWorkspace] ${error.message}`);
        return true;
      },
      () => {
        localDb.data.transactions = localDb.data.transactions.filter(t => t.workspace_id !== workspaceId && t.workspaceId !== workspaceId);
        localDb.save();
        return true;
      }
    );
  }
};

// ─── 4. DOCUMENTS REPOSITORY ─────────────────────────────────────────────────
export const documentsRepo = {
  async listByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[documentsRepo.listByWorkspace] ${error.message}`);
        return (data || []).map(d => ({
          _id: d.id,
          id: d.id,
          workspaceId: d.workspace_id,
          fileName: d.file_name,
          parserUsed: d.parser_used,
          summary: d.summary,
          extractedTransactions: d.extracted_transactions,
          createdAt: d.created_at
        }));
      },
      () => localDb.listDocuments(workspaceId)
    );
  },

  async findById(id) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(`[documentsRepo.findById] ${error.message}`);
        if (!data) return null;

        return {
          _id: data.id,
          id: data.id,
          workspaceId: data.workspace_id,
          fileName: data.file_name,
          parserUsed: data.parser_used,
          summary: data.summary,
          extractedTransactions: data.extracted_transactions,
          createdAt: data.created_at
        };
      },
      () => localDb.findDocumentById(id)
    );
  },

  async create({ workspaceId, fileName, parserUsed, summary, extractedTransactions }) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: workspaceId,
          file_name: fileName,
          parser_used: parserUsed,
          summary: summary || {},
          extracted_transactions: extractedTransactions || []
        };

        const { data, error } = await supabase
          .from('uploaded_documents')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[documentsRepo.create] ${error.message}`);
        return {
          _id: data.id,
          id: data.id,
          workspaceId: data.workspace_id,
          fileName: data.file_name,
          parserUsed: data.parser_used,
          summary: data.summary,
          extractedTransactions: data.extracted_transactions,
          createdAt: data.created_at
        };
      },
      () => localDb.createDocument({ workspaceId, fileName, parserUsed, summary, extractedTransactions })
    );
  },

  async delete(id) {
    if (!id) return false;

    return safeDb(
      async () => {
        const { data: doc } = await supabase
          .from('uploaded_documents')
          .select('id, workspace_id, extracted_transactions')
          .eq('id', id)
          .maybeSingle();

        if (doc && Array.isArray(doc.extracted_transactions) && doc.extracted_transactions.length > 0) {
          const dates = Array.from(new Set(doc.extracted_transactions.map(t => t.date).filter(Boolean)));
          if (dates.length > 0) {
            await supabase
              .from('transactions')
              .delete()
              .eq('workspace_id', doc.workspace_id)
              .in('date', dates);
          }
        }

        const { error } = await supabase.from('uploaded_documents').delete().eq('id', id);
        if (error) throw new Error(`[documentsRepo.delete] ${error.message}`);
        return true;
      },
      () => localDb.deleteDocument(id)
    );
  }
};

// ─── 5. INVOICES REPOSITORY ──────────────────────────────────────────────────
export const invoicesRepo = {
  async listByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[invoicesRepo.listByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listInvoices(workspaceId)
    );
  },

  async create(invData) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .insert(invData)
          .select()
          .single();

        if (error) throw new Error(`[invoicesRepo.create] ${error.message}`);
        return data;
      },
      () => localDb.createInvoice(invData)
    );
  }
};

// ─── 6. KHATA REPOSITORY ─────────────────────────────────────────────────────
export const khataRepo = {
  async listByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('khata_ledgers')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[khataRepo.listByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listKhata(workspaceId)
    );
  },

  async create(khataData) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('khata_ledgers')
          .insert(khataData)
          .select()
          .single();

        if (error) throw new Error(`[khataRepo.create] ${error.message}`);
        return data;
      },
      () => localDb.createKhata(khataData)
    );
  }
};

// ─── 7. DEVICE SESSIONS REPOSITORY ───────────────────────────────────────────
export const deviceSessionsRepo = {
  async listByUser(userId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('last_active', { ascending: false });

        if (error) throw new Error(`[deviceSessionsRepo.listByUser] ${error.message}`);
        return data || [];
      },
      () => localDb.listSessions(userId)
    );
  },

  async upsert(arg1, arg2) {
    const userId = typeof arg1 === 'object' ? (arg1.userId || arg1.user_id) : arg1;
    const dev = typeof arg1 === 'object' ? arg1 : (arg2 || {});
    const devId = dev.deviceId || dev.device_id || 'web_default';

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('device_sessions')
          .upsert({
            user_id: userId,
            device_id: devId,
            device_name: dev.deviceName || 'Web Client',
            platform: dev.platform || 'Web',
            last_active: new Date().toISOString()
          })
          .select()
          .single();

        if (error) console.warn('[deviceSessionsRepo.upsert]', error.message);
        return data;
      },
      () => localDb.upsertSession(userId, dev)
    );
  },

  async revoke(sessionId) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('device_sessions').delete().eq('id', sessionId);
        if (error) console.warn('[deviceSessionsRepo.revoke]', error.message);
        return true;
      },
      () => localDb.revokeSession(sessionId)
    );
  }
};

// ─── 8. OTP REPOSITORY ───────────────────────────────────────────────────────
export const otpRepo = {
  async saveOtp({ email, code, purpose = 'auth' }) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return this.store(email, code, purpose, expiresAt);
  },

  async verifyOtp({ email, code, purpose = 'auth' }) {
    return this.verify(email, code, purpose);
  },

  async store(email, otpCode, purpose = 'auth', expiresAt = new Date(Date.now() + 15 * 60 * 1000)) {
    return safeDb(
      async () => {
        const cleanEmail = email.trim().toLowerCase();
        await supabase.from('otp_verifications').delete().eq('email', cleanEmail);
        const { data, error } = await supabase
          .from('otp_verifications')
          .insert({
            email: cleanEmail,
            otp_code: String(otpCode),
            purpose,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (error) throw new Error(`[otpRepo.store] ${error.message}`);
        return data;
      },
      () => localDb.storeOtp(email, otpCode, purpose, expiresAt)
    );
  },

  async verify(email, otpCode, purpose = 'auth') {
    return safeDb(
      async () => {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('email', cleanEmail)
          .eq('otp_code', String(otpCode))
          .eq('is_verified', false)
          .maybeSingle();

        if (error || !data) return false;
        if (new Date() > new Date(data.expires_at)) return false;

        await supabase.from('otp_verifications').update({ is_verified: true }).eq('id', data.id);
        return true;
      },
      () => localDb.verifyOtp(email, otpCode, purpose)
    );
  }
};

// ─── 9. MERCHANT MAPPINGS REPOSITORY ─────────────────────────────────────────
export const merchantMappingsRepo = {
  async getMappings(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('merchant_mappings')
          .select('*')
          .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);

        if (error) return [];
        return data || [];
      },
      () => localDb.getMerchantMappings(workspaceId)
    );
  },

  async saveMapping({ workspaceId, rawPattern, cleanMerchant, category, confidence = 0.95 }) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('merchant_mappings')
          .upsert({
            workspace_id: workspaceId || null,
            raw_pattern: rawPattern,
            clean_merchant: cleanMerchant,
            category,
            confidence
          })
          .select()
          .single();

        if (error) console.warn('[merchantMappingsRepo.saveMapping]', error.message);
        return data;
      },
      () => localDb.saveMerchantMapping({ workspaceId, rawPattern, cleanMerchant, category, confidence })
    );
  }
};

// ─── 10. ACCOUNT PURGE ───────────────────────────────────────────────────────
export async function purgeUserAccountAndAllData(userId) {
  if (!userId) return false;
  localDb.data.users = localDb.data.users.filter(u => u.id !== userId && u._id !== userId);
  localDb.data.workspaces = localDb.data.workspaces.filter(w => w.owner_id !== userId && w.ownerId !== userId);
  localDb.save();
  return true;
}
