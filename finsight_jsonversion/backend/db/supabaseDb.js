/**
 * ==============================================================================
 * HISABHERO ENTERPRISE SUPABASE DATA ACCESS LAYER (DAL)
 * ==============================================================================
 * 
 * Supabase PostgreSQL is the Exclusive Primary Database Engine.
 * Features:
 *  - Fully normalized PostgreSQL queries
 *  - Automated UUID validation and mapping
 *  - Multi-tenant workspace and role isolation
 *  - Resilient local persistence failover for network/DNS outages
 *  - ZERO MongoDB or Mongoose dependencies
 */

import { supabase, storageHelper } from './supabaseClient.js';
import { localDb } from './localDb.js';

let isSupabaseOffline = false;

// Universal Safe Executor with instant local failover
export async function safeDb(supabaseFn, localDbFn) {
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
        console.warn('⚠️ Supabase network unreachable (' + msg + '). Activating resilient local database.');
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
          password: data.password,
          passwordHash: data.password,
          role: data.role || 'owner',
          accountType: data.account_type || 'personal',
          isVerified: data.is_verified ?? true,
          authProviders: data.auth_providers || [],
          activeWorkspace: data.active_workspace_id,
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
          password: data.password,
          passwordHash: data.password,
          role: data.role || 'owner',
          accountType: data.account_type || 'personal',
          isVerified: data.is_verified ?? true,
          authProviders: data.auth_providers || [],
          activeWorkspace: data.active_workspace_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      },
      () => localDb.findUserById(id)
    );
  },

  async create({ email, fullName, password, passwordHash, role = 'owner', accountType = 'personal', isVerified = true, authProviders = [] }) {
    const cleanEmail = email.trim().toLowerCase();
    const finalHash = passwordHash || password;

    return safeDb(
      async () => {
        const payload = {
          email: cleanEmail,
          full_name: fullName || 'User',
          password: finalHash,
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

        // Sync with local cache
        try {
          localDb.createUser({ id: data.id, email: cleanEmail, fullName, password: finalHash, role, accountType, isVerified, authProviders });
        } catch (e) {}

        return {
          _id: data.id,
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          accountType: data.account_type,
          isVerified: data.is_verified,
          createdAt: data.created_at
        };
      },
      () => localDb.createUser({ email: cleanEmail, fullName, password: finalHash, role, accountType, isVerified, authProviders })
    );
  },

  async update(id, updates) {
    if (!id) return null;

    return safeDb(
      async () => {
        const payload = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.password || updates.passwordHash) payload.password = updates.passwordHash || updates.password;
        if (updates.role) payload.role = updates.role;
        if (updates.accountType) payload.account_type = updates.accountType;
        if (updates.isVerified !== undefined) payload.is_verified = updates.isVerified;
        if (updates.activeWorkspace) payload.active_workspace_id = updates.activeWorkspace;
        if (updates.authProviders) payload.auth_providers = updates.authProviders;
        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(`[usersRepo.update] ${error.message}`);
        localDb.updateUser(id, updates);
        return data;
      },
      () => localDb.updateUser(id, updates)
    );
  },

  async delete(id) {
    if (!id) return false;
    return safeDb(
      async () => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteUser(id);
        return true;
      },
      () => localDb.deleteUser(id)
    );
  }
};

// ─── 2. WORKSPACES REPOSITORY ────────────────────────────────────────────────
export const workspacesRepo = {
  async findById(id) {
    if (!id) return null;

    return safeDb(
      async () => {
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
          owner_id: data.owner_id,
          businessName: data.business_name,
          business_name: data.business_name,
          industry: data.industry,
          currency: data.currency || 'INR',
          joinCode: data.join_code,
          join_code: data.join_code,
          cashBalance: Number(data.cash_balance || 0),
          cash_balance: Number(data.cash_balance || 0),
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
          owner_id: w.owner_id,
          businessName: w.business_name,
          business_name: w.business_name,
          industry: w.industry,
          currency: w.currency,
          joinCode: w.join_code,
          join_code: w.join_code,
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
        if (!data) return localDb.data.workspaces.find(w => w.join_code === cleanCode || w.joinCode === cleanCode) || null;

        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          type: data.type,
          ownerId: data.owner_id,
          businessName: data.business_name,
          joinCode: data.join_code
        };
      },
      () => localDb.data.workspaces.find(w => w.join_code === cleanCode || w.joinCode === cleanCode) || null
    );
  },

  async create({ name, type = 'personal', ownerId, businessName, industry, currency = 'INR', joinCode, settings = {} }) {
    const wsName = name || (type === 'business' && businessName ? businessName : 'My Workspace');

    return safeDb(
      async () => {
        const payload = {
          name: wsName,
          type,
          owner_id: ownerId,
          business_name: businessName || (type === 'business' ? wsName : null),
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

        // Add creator as owner member in workspace_members
        try {
          await supabase.from('workspace_members').insert({
            workspace_id: data.id,
            user_id: ownerId,
            role: 'owner',
            status: 'active'
          });
        } catch (e) {}

        // Mirror to local cache
        try {
          localDb.createWorkspace({
            id: data.id,
            name: wsName,
            type,
            ownerId,
            businessName: payload.business_name,
            industry,
            currency,
            joinCode,
            settings: payload.settings
          });
        } catch (e) {}

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
      () => localDb.createWorkspace({ name: wsName, type, ownerId, businessName, industry, currency, joinCode, settings })
    );
  },

  async getUserWorkspaces(userId) {
    if (!userId) return [];

    return safeDb(
      async () => {
        // 1. Get owned workspaces
        const owned = await this.findByOwnerId(userId);

        // 2. Get workspaces where user is a member
        const { data: memberRows, error: memErr } = await supabase
          .from('workspace_members')
          .select('workspace_id, role')
          .eq('user_id', userId)
          .eq('status', 'active');

        let memberWorkspaces = [];
        if (!memErr && memberRows && memberRows.length > 0) {
          const wsIds = memberRows.map(r => r.workspace_id).filter(id => !owned.some(o => o.id === id));
          if (wsIds.length > 0) {
            const { data: joinedWs } = await supabase
              .from('workspaces')
              .select('*')
              .in('id', wsIds);

            if (joinedWs) {
              memberWorkspaces = joinedWs.map(w => {
                const mem = memberRows.find(m => m.workspace_id === w.id);
                return {
                  _id: w.id,
                  id: w.id,
                  name: w.name,
                  type: w.type,
                  ownerId: w.owner_id,
                  businessName: w.business_name,
                  industry: w.industry,
                  currency: w.currency,
                  joinCode: w.join_code,
                  role: mem?.role || 'member',
                  cashBalance: Number(w.cash_balance || 0),
                  settings: w.settings,
                  createdAt: w.created_at
                };
              });
            }
          }
        }

        const combined = [...owned, ...memberWorkspaces];
        return combined.length > 0 ? combined : localDb.findWorkspacesByOwner(userId);
      },
      () => localDb.findWorkspacesByOwner(userId)
    );
  },

  async upgradeToBusiness(workspaceId, businessDetails = {}) {
    return safeDb(
      async () => {
        const payload = {
          type: 'business',
          updated_at: new Date().toISOString()
        };
        if (businessDetails.businessName) payload.business_name = businessDetails.businessName;
        if (businessDetails.industry) payload.industry = businessDetails.industry;

        const { data, error } = await supabase
          .from('workspaces')
          .update(payload)
          .eq('id', workspaceId)
          .select()
          .single();

        if (error) throw new Error(`[workspacesRepo.upgradeToBusiness] ${error.message}`);
        localDb.upgradeWorkspaceToBusiness(workspaceId);
        return data;
      },
      () => localDb.upgradeWorkspaceToBusiness(workspaceId)
    );
  },

  async addMember(workspaceId, memberData) {
    const userId = memberData.userId || memberData.user_id;
    const role = memberData.role || 'member';

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('workspace_members')
          .upsert({
            workspace_id: workspaceId,
            user_id: userId,
            role,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'workspace_id,user_id' })
          .select()
          .single();

        if (error) throw error;
        localDb.addWorkspaceMember({ workspaceId, ...memberData });
        return data;
      },
      () => localDb.addWorkspaceMember({ workspaceId, ...memberData })
    );
  },

  async getMembers(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('workspace_members')
          .select(`
            id,
            role,
            status,
            joined_at,
            user_id,
            users (
              id,
              full_name,
              email
            )
          `)
          .eq('workspace_id', workspaceId);

        if (error) throw error;
        if (data && data.length > 0) {
          return data.map(m => ({
            id: m.users?.id || m.user_id,
            userId: m.user_id,
            fullName: m.users?.full_name || 'Member',
            email: m.users?.email || '',
            role: m.role,
            status: m.status || 'Active',
            joinedAt: m.joined_at
          }));
        }

        // Fallback: Check workspace owner
        const ws = await this.findById(workspaceId);
        if (ws && ws.ownerId) {
          const owner = await usersRepo.findById(ws.ownerId);
          if (owner) {
            return [{
              id: owner.id,
              userId: owner.id,
              fullName: owner.fullName,
              email: owner.email,
              role: 'owner',
              status: 'Active',
              joinedAt: new Date().toISOString().split('T')[0]
            }];
          }
        }
        return [];
      },
      () => {
        const ws = localDb.findWorkspaceById(workspaceId);
        if (ws && (ws.owner_id || ws.ownerId)) {
          const owner = localDb.findUserById(ws.owner_id || ws.ownerId);
          if (owner) {
            return [{
              id: owner.id,
              userId: owner.id,
              fullName: owner.fullName || owner.full_name,
              email: owner.email,
              role: 'owner',
              status: 'Active',
              joinedAt: new Date().toISOString().split('T')[0]
            }];
          }
        }
        return [];
      }
    );
  },

  async resetData(workspaceId) {
    return safeDb(
      async () => {
        await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
        await supabase.from('uploaded_documents').delete().eq('workspace_id', workspaceId);
        localDb.resetWorkspaceData(workspaceId);
        return true;
      },
      () => localDb.resetWorkspaceData(workspaceId)
    );
  }
};

// ─── 3. TRANSACTIONS REPOSITORY ──────────────────────────────────────────────
export const transactionsRepo = {
  async create(tx) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: tx.workspaceId || tx.workspace_id,
          user_id: tx.userId || tx.user_id || null,
          type: (tx.type || 'expense').toLowerCase(),
          category: tx.category || 'General',
          amount: Number(tx.amount || 0),
          description: tx.description || 'Transaction',
          merchant: tx.merchant || null,
          date: tx.date || new Date().toISOString().split('T')[0],
          payment_method: tx.paymentMethod || tx.payment_method || 'Cash',
          source: tx.source || 'Manual',
          tax_rate: Number(tx.taxRate || tx.tax_rate || 0),
          tax_amount: Number(tx.taxAmount || tx.tax_amount || 0),
          is_verified: tx.isVerified ?? true,
          metadata: tx.metadata || {}
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[transactionsRepo.create] ${error.message}`);
        localDb.createTransaction({ ...tx, id: data.id, _id: data.id });

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
          workspace_id: tx.workspaceId || tx.workspace_id,
          user_id: tx.userId || tx.user_id || null,
          type: (tx.type || 'expense').toLowerCase(),
          category: tx.category || 'General',
          amount: Number(tx.amount || 0),
          description: tx.description || 'Transaction',
          merchant: tx.merchant || null,
          date: tx.date || new Date().toISOString().split('T')[0],
          payment_method: tx.paymentMethod || tx.payment_method || 'Cash',
          source: tx.source || 'Statement Ingestion',
          tax_rate: Number(tx.taxRate || tx.tax_rate || 0),
          tax_amount: Number(tx.taxAmount || tx.tax_amount || 0),
          is_verified: tx.isVerified ?? true,
          metadata: tx.metadata || {}
        }));

        const { data, error } = await supabase
          .from('transactions')
          .insert(payloads)
          .select();

        if (error) throw new Error(`[transactionsRepo.createBatch] ${error.message}`);
        localDb.createTransactionsBatch(txList);
        return data || [];
      },
      () => localDb.createTransactionsBatch(txList)
    );
  },

  async findByWorkspace(workspaceId, options = {}) {
    return safeDb(
      async () => {
        let query = supabase
          .from('transactions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('date', { ascending: false });

        if (options.startDate) query = query.gte('date', options.startDate);
        if (options.endDate) query = query.lte('date', options.endDate);
        if (options.category) query = query.eq('category', options.category);
        if (options.type) query = query.eq('type', options.type.toLowerCase());
        if (options.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) throw new Error(`[transactionsRepo.findByWorkspace] ${error.message}`);

        return (data || []).map(t => ({
          _id: t.id,
          id: t.id,
          workspaceId: t.workspace_id,
          userId: t.user_id,
          type: t.type,
          category: t.category,
          amount: Number(t.amount),
          description: t.description,
          merchant: t.merchant,
          date: t.date,
          paymentMethod: t.payment_method,
          taxAmount: Number(t.tax_amount || 0),
          isVerified: t.is_verified,
          createdAt: t.created_at
        }));
      },
      () => localDb.findTransactionsByWorkspace(workspaceId, options)
    );
  },

  async findById(id) {
    if (!id) return null;

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(`[transactionsRepo.findById] ${error.message}`);
        if (!data) return localDb.findTransactionById(id);

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
          createdAt: data.created_at
        };
      },
      () => localDb.findTransactionById(id)
    );
  },

  async update(id, updates) {
    if (!id) return null;

    return safeDb(
      async () => {
        const payload = {};
        if (updates.type) payload.type = updates.type.toLowerCase();
        if (updates.category) payload.category = updates.category;
        if (updates.amount !== undefined) payload.amount = Number(updates.amount);
        if (updates.description) payload.description = updates.description;
        if (updates.merchant !== undefined) payload.merchant = updates.merchant;
        if (updates.date) payload.date = updates.date;
        if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;
        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(`[transactionsRepo.update] ${error.message}`);
        localDb.updateTransaction(id, updates);
        return data;
      },
      () => localDb.updateTransaction(id, updates)
    );
  },

  async delete(id) {
    if (!id) return false;

    return safeDb(
      async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteTransaction(id);
        return true;
      },
      () => localDb.deleteTransaction(id)
    );
  },

  async deleteByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('transactions').delete().eq('workspace_id', workspaceId);
        if (error) throw error;
        localDb.deleteTransactionsByWorkspace(workspaceId);
        return true;
      },
      () => localDb.deleteTransactionsByWorkspace(workspaceId)
    );
  }
};

// ─── 4. DOCUMENTS REPOSITORY ─────────────────────────────────────────────────
export const documentsRepo = {
  async create(docData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: docData.workspaceId || docData.workspace_id,
          file_name: docData.fileName || docData.file_name || 'Uploaded Statement',
          file_size: docData.fileSize || 0,
          mime_type: docData.mimeType || 'application/pdf',
          storage_path: docData.storagePath || null,
          parser_used: docData.parserUsed || 'Statement Parser',
          summary: docData.summary || {},
          extracted_transactions: docData.extractedTransactions || []
        };

        const { data, error } = await supabase
          .from('uploaded_documents')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[documentsRepo.create] ${error.message}`);
        localDb.createDocument({ ...docData, id: data.id, _id: data.id });

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
      () => localDb.createDocument(docData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[documentsRepo.findByWorkspace] ${error.message}`);
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
      () => localDb.findDocumentsByWorkspace(workspaceId)
    );
  },

  async findById(id) {
    if (!id) return null;

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(`[documentsRepo.findById] ${error.message}`);
        if (!data) return localDb.findDocumentById(id);

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

  async delete(id) {
    if (!id) return false;
    return safeDb(
      async () => {
        const { error } = await supabase.from('uploaded_documents').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteDocument(id);
        return true;
      },
      () => localDb.deleteDocument(id)
    );
  },

  async deleteByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('uploaded_documents').delete().eq('workspace_id', workspaceId);
        if (error) throw error;
        localDb.deleteDocumentsByWorkspace(workspaceId);
        return true;
      },
      () => localDb.deleteDocumentsByWorkspace(workspaceId)
    );
  }
};

// ─── 5. INVOICES REPOSITORY ──────────────────────────────────────────────────
export const invoicesRepo = {
  async create(invoiceData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: invoiceData.workspaceId || invoiceData.workspace_id,
          invoice_number: invoiceData.invoiceNumber || invoiceData.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
          customer_name: invoiceData.customerName || invoiceData.customer_name || 'Customer',
          customer_email: invoiceData.customerEmail || null,
          customer_gstin: invoiceData.customerGstin || null,
          date: invoiceData.date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate || invoiceData.due_date || null,
          items: invoiceData.items || invoiceData.lineItems || [],
          subtotal: Number(invoiceData.subtotal || 0),
          cgst: Number(invoiceData.cgst || 0),
          sgst: Number(invoiceData.sgst || 0),
          igst: Number(invoiceData.igst || 0),
          total_tax: Number(invoiceData.totalTax || invoiceData.total_tax || 0),
          total_amount: Number(invoiceData.total || invoiceData.totalAmount || 0),
          paid_amount: Number(invoiceData.paidAmount || 0),
          status: invoiceData.status || 'unpaid',
          notes: invoiceData.notes || null
        };

        const { data, error } = await supabase
          .from('invoices')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[invoicesRepo.create] ${error.message}`);
        localDb.createInvoice({ ...invoiceData, id: data.id, _id: data.id });
        return data;
      },
      () => localDb.createInvoice(invoiceData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[invoicesRepo.findByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listInvoices(workspaceId)
    );
  },

  async findById(id) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        return data || localDb.findInvoiceById(id);
      },
      () => localDb.findInvoiceById(id)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteInvoice(id);
        return true;
      },
      () => localDb.deleteInvoice(id)
    );
  }
};

// ─── 6. KHATA REPOSITORY ─────────────────────────────────────────────────────
export const khataRepo = {
  async create(khataData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: khataData.workspaceId || khataData.workspace_id,
          party_name: khataData.partyName || khataData.party_name || 'Party',
          party_type: khataData.partyType || khataData.party_type || 'customer',
          phone: khataData.phone || null,
          email: khataData.email || null,
          current_balance: Number(khataData.netBalance || khataData.current_balance || 0),
          credit_limit: Number(khataData.creditLimit || 0),
          currency: khataData.currency || 'INR',
          entries: khataData.entries || [],
          notes: khataData.notes || null
        };

        const { data, error } = await supabase
          .from('khata_ledgers')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[khataRepo.create] ${error.message}`);
        localDb.createKhataLedger({ ...khataData, id: data.id, _id: data.id });
        return data;
      },
      () => localDb.createKhataLedger(khataData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('khata_ledgers')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[khataRepo.findByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listKhataLedgers(workspaceId)
    );
  },

  async findById(id) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('khata_ledgers')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        return data || localDb.findKhataLedgerById(id);
      },
      () => localDb.findKhataLedgerById(id)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('khata_ledgers').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteKhataLedger(id);
        return true;
      },
      () => localDb.deleteKhataLedger(id)
    );
  }
};

// ─── 7. INVENTORY & FIXED ASSETS REPOSITORY ──────────────────────────────────
export const inventoryRepo = {
  async create(itemData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: itemData.workspaceId || itemData.workspace_id,
          name: itemData.name || 'Stock Item',
          type: itemData.type || 'stock',
          sku: itemData.sku || null,
          category: itemData.category || 'General',
          stock_quantity: Number(itemData.stockQuantity || itemData.stock_quantity || 0),
          unit_value: Number(itemData.unitValue || itemData.unit_value || 0),
          reorder_level: Number(itemData.reorderLevel || itemData.reorder_level || 5),
          useful_life: Number(itemData.usefulLife || itemData.useful_life || 5),
          depreciation_method: itemData.depreciationMethod || 'straight_line'
        };

        const { data, error } = await supabase
          .from('inventory_items')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[inventoryRepo.create] ${error.message}`);
        localDb.createInventoryItem({ ...itemData, id: data.id, _id: data.id });
        return data;
      },
      () => localDb.createInventoryItem(itemData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[inventoryRepo.findByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listInventoryItems(workspaceId)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('inventory_items').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteInventoryItem(id);
        return true;
      },
      () => localDb.deleteInventoryItem(id)
    );
  }
};

// ─── 8. SUBSCRIPTIONS REPOSITORY ─────────────────────────────────────────────
export const subscriptionsRepo = {
  async create(subData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: subData.workspaceId || subData.workspace_id,
          name: subData.name || 'Subscription',
          amount: Number(subData.amount || 0),
          billing_cycle: subData.billingCycle || subData.billing_cycle || 'monthly',
          category: subData.category || 'Software',
          next_billing_date: subData.nextBillingDate || subData.next_billing_date || null,
          status: subData.status || 'active',
          payment_method: subData.paymentMethod || 'Card'
        };

        const { data, error } = await supabase
          .from('subscriptions')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[subscriptionsRepo.create] ${error.message}`);
        localDb.createSubscription({ ...subData, id: data.id, _id: data.id });
        return data;
      },
      () => localDb.createSubscription(subData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[subscriptionsRepo.findByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listSubscriptions(workspaceId)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('subscriptions').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteSubscription(id);
        return true;
      },
      () => localDb.deleteSubscription(id)
    );
  }
};

// ─── 9. STAFF (PAGAR KHATA & ATTENDANCE) REPOSITORY ──────────────────────────
export const staffRepo = {
  async create(staffData) {
    return safeDb(
      async () => {
        const payload = {
          workspace_id: staffData.workspaceId || staffData.workspace_id,
          name: staffData.name || 'Staff Member',
          role: staffData.role || 'Staff',
          monthly_salary: Number(staffData.monthlySalary || staffData.baseSalary || 0),
          base_salary: Number(staffData.baseSalary || staffData.monthlySalary || 0),
          daily_wage: Number(staffData.dailyWage || 0),
          attendance: staffData.attendance || { present: 0, absent: 0, halfDay: 0, overtimeDays: 0 },
          advances_drawn: Number(staffData.advancesDrawn || 0),
          net_payable: Number(staffData.netPayable || staffData.monthlySalary || 0),
          advances: staffData.advances || [],
          phone: staffData.phone || null
        };

        const { data, error } = await supabase
          .from('staff')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(`[staffRepo.create] ${error.message}`);
        localDb.createStaff({ ...staffData, id: data.id, _id: data.id });
        return data;
      },
      () => localDb.createStaff(staffData)
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw new Error(`[staffRepo.findByWorkspace] ${error.message}`);
        return data || [];
      },
      () => localDb.listStaff(workspaceId)
    );
  },

  async findById(id) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        return data || localDb.findStaffById(id);
      },
      () => localDb.findStaffById(id)
    );
  },

  async update(id, updates) {
    return safeDb(
      async () => {
        const payload = { ...updates, updated_at: new Date().toISOString() };
        const { data, error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        localDb.updateStaff(id, updates);
        return data;
      },
      () => localDb.updateStaff(id, updates)
    );
  },

  async delete(id) {
    return safeDb(
      async () => {
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) throw error;
        localDb.deleteStaff(id);
        return true;
      },
      () => localDb.deleteStaff(id)
    );
  }
};

// ─── 10. DEVICE SESSIONS REPOSITORY ──────────────────────────────────────────
export const deviceSessionsRepo = {
  async register(userId, { deviceId, deviceName, ipAddress, userAgent }) {
    if (!userId || !deviceId) return null;

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('device_sessions')
          .upsert({
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName || 'Device',
            ip_address: ipAddress || '127.0.0.1',
            user_agent: userAgent || 'Client',
            last_active: new Date().toISOString()
          }, { onConflict: 'user_id,device_id' })
          .select()
          .single();

        if (error) throw error;
        localDb.saveDeviceSession({ userId, deviceId, deviceName, ipAddress, userAgent });
        return data;
      },
      () => localDb.saveDeviceSession({ userId, deviceId, deviceName, ipAddress, userAgent })
    );
  },

  async listByUser(userId) {
    if (!userId) return [];

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('last_active', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      () => localDb.findDeviceSessionsByUser(userId)
    );
  },

  async revoke(userId, deviceId) {
    return safeDb(
      async () => {
        const { error } = await supabase
          .from('device_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('device_id', deviceId);

        if (error) throw error;
        localDb.revokeDeviceSession(userId, deviceId);
        return true;
      },
      () => localDb.revokeDeviceSession(userId, deviceId)
    );
  }
};

// ─── 11. OTP REPOSITORY ──────────────────────────────────────────────────────
export const otpRepo = {
  async saveOtp({ email, code, purpose = 'signup', ttlMinutes = 10 }) {
    const cleanEmail = email.trim().toLowerCase();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('otp_verifications')
          .insert({
            email: cleanEmail,
            code,
            purpose,
            expires_at: expiresAt,
            verified: false
          })
          .select()
          .single();

        if (error) throw error;
        localDb.saveOtp({ email: cleanEmail, code, purpose, expiresAt });
        return data;
      },
      () => localDb.saveOtp({ email: cleanEmail, code, purpose, expiresAt })
    );
  },

  async verifyOtp({ email, code, purpose = 'signup' }) {
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = String(code).trim();

    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('email', cleanEmail)
          .eq('code', otpCode)
          .eq('purpose', purpose)
          .eq('verified', false)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data) return localDb.verifyOtp({ email: cleanEmail, code: otpCode, purpose });

        // Mark as verified
        await supabase
          .from('otp_verifications')
          .update({ verified: true })
          .eq('id', data.id);

        return true;
      },
      () => localDb.verifyOtp({ email: cleanEmail, code: otpCode, purpose })
    );
  }
};

// ─── 12. MERCHANT MAPPINGS REPOSITORY ────────────────────────────────────────
export const merchantMappingsRepo = {
  async saveMapping({ workspaceId, rawPattern, cleanMerchant, category }) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('merchant_mappings')
          .upsert({
            workspace_id: workspaceId,
            raw_pattern: rawPattern.trim(),
            clean_merchant: cleanMerchant.trim(),
            category: category.trim()
          }, { onConflict: 'workspace_id,raw_pattern' })
          .select()
          .single();

        if (error) throw error;
        localDb.saveMerchantMapping({ workspaceId, rawPattern, cleanMerchant, category });
        return data;
      },
      () => localDb.saveMerchantMapping({ workspaceId, rawPattern, cleanMerchant, category })
    );
  },

  async findByWorkspace(workspaceId) {
    return safeDb(
      async () => {
        const { data, error } = await supabase
          .from('merchant_mappings')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (error) throw error;
        return data || [];
      },
      () => localDb.findMerchantMappingsByWorkspace(workspaceId)
    );
  }
};

// ─── 13. ACCOUNT PURGE ───────────────────────────────────────────────────────
export async function purgeUserAccountAndAllData(userId) {
  return safeDb(
    async () => {
      // Find workspaces owned by user
      const owned = await workspacesRepo.findByOwnerId(userId);
      for (const ws of owned) {
        await transactionsRepo.deleteByWorkspace(ws.id);
        await documentsRepo.deleteByWorkspace(ws.id);
        await supabase.from('invoices').delete().eq('workspace_id', ws.id);
        await supabase.from('khata_ledgers').delete().eq('workspace_id', ws.id);
        await supabase.from('inventory_items').delete().eq('workspace_id', ws.id);
        await supabase.from('staff').delete().eq('workspace_id', ws.id);
        await supabase.from('workspaces').delete().eq('id', ws.id);
      }
      await supabase.from('device_sessions').delete().eq('user_id', userId);
      await usersRepo.delete(userId);
      localDb.purgeUserAccount(userId);
      return true;
    },
    () => localDb.purgeUserAccount(userId)
  );
}

export default {
  usersRepo,
  workspacesRepo,
  transactionsRepo,
  documentsRepo,
  invoicesRepo,
  khataRepo,
  inventoryRepo,
  subscriptionsRepo,
  staffRepo,
  deviceSessionsRepo,
  otpRepo,
  merchantMappingsRepo,
  purgeUserAccountAndAllData
};
