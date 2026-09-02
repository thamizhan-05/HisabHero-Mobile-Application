/**
 * HISABHERO SUPABASE DATA ACCESS LAYER (DAL)
 * Enterprise PostgreSQL Data Engine replacing Mongoose/MongoDB completely.
 */

import { supabase } from './supabaseClient.js';

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

  async findById(id) {
    if (!id) return null;
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

  async create({ email, fullName, password, role = 'owner', accountType = 'personal', isVerified = true, authProviders = [] }) {
    const cleanEmail = email.trim().toLowerCase();
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

  async update(id, updates) {
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

  async delete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(`[usersRepo.delete] ${error.message}`);
    return true;
  }
};

// ─── 2. WORKSPACES REPOSITORY ────────────────────────────────────────────────
export const workspacesRepo = {
  async findById(id) {
    if (!id || !isValidUUID(id)) return null;
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[workspacesRepo.findById] ${error.message}`);
    if (!data) return null;

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

  async findByOwnerId(ownerId) {
    if (!ownerId) return [];
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

  async findByJoinCode(joinCode) {
    if (!joinCode) return null;
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('join_code', joinCode.trim().toUpperCase())
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

  async create({ name, type = 'personal', ownerId, businessName, industry, currency = 'INR', joinCode, settings = {} }) {
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

  async update(id, updates) {
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

  async delete(id) {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw new Error(`[workspacesRepo.delete] ${error.message}`);
    return true;
  },

  async getUserWorkspaces(userId) {
    const owned = await this.findByOwnerId(userId);

    // Also get memberships
    const { data: memberData } = await supabase
      .from('workspace_members')
      .select('role, workspace:workspaces(*)')
      .eq('user_id', userId);

    const memberWs = (memberData || [])
      .filter(m => m.workspace)
      .map(m => ({
        _id: m.workspace.id,
        id: m.workspace.id,
        name: m.workspace.name,
        type: m.workspace.type,
        ownerId: m.workspace.owner_id,
        currency: m.workspace.currency,
        joinCode: m.workspace.join_code,
        role: m.role || 'employee',
        isOwner: m.workspace.owner_id === userId
      }));

    // Merge and deduplicate by id
    const map = new Map();
    owned.forEach(w => map.set(w.id, { ...w, isOwner: true, role: 'owner' }));
    memberWs.forEach(w => {
      if (!map.has(w.id)) map.set(w.id, w);
    });

    return Array.from(map.values());
  }
};

// ─── 3. TRANSACTIONS REPOSITORY ──────────────────────────────────────────────
export const transactionsRepo = {
  async create(tx) {
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

  async createBatch(txList) {
    if (!Array.isArray(txList) || txList.length === 0) return [];

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

  async listByWorkspace(workspaceId, { limit = 500, offset = 0, type, category } = {}) {
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

  async getMetrics(workspaceId) {
    if (!workspaceId) return { totalInflow: 0, totalOutflow: 0, netBalance: 0, count: 0, categoryBreakdown: {} };

    const { data, error } = await supabase
      .from('transactions')
      .select('type, category, amount')
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(`[transactionsRepo.getMetrics] ${error.message}`);

    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryBreakdown = {};

    (data || []).forEach(tx => {
      const amt = Number(tx.amount || 0);
      const isIncome = tx.type === 'income' || tx.type === 'INCOME';
      if (isIncome) {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + amt;
      }
    });

    return {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      count: (data || []).length,
      categoryBreakdown
    };
  },

  async delete(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(`[transactionsRepo.delete] ${error.message}`);
    return true;
  },

  async deleteByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('workspace_id', workspaceId)
      .select('id');

    if (error) throw new Error(`[transactionsRepo.deleteByWorkspace] ${error.message}`);
    return (data || []).length;
  }
};

// ─── 4. UPLOADED DOCUMENTS REPOSITORY ─────────────────────────────────────────
export const documentsRepo = {
  async create({ workspaceId, fileName, fileSize, mimeType, parserUsed, summary = {}, extractedTransactions = [] }) {
    const payload = {
      workspace_id: workspaceId,
      file_name: fileName,
      file_size: fileSize || 0,
      mime_type: mimeType || 'application/pdf',
      parser_used: parserUsed || 'Gemini 2.5 Flash',
      status: 'processed',
      summary,
      extracted_transactions: extractedTransactions
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
      documentId: data.id,
      workspaceId: data.workspace_id,
      fileName: data.file_name,
      fileSize: data.file_size,
      parserUsed: data.parser_used,
      summary: data.summary,
      extractedTransactions: data.extracted_transactions,
      createdAt: data.created_at
    };
  },

  async listByWorkspace(workspaceId) {
    if (!workspaceId) return [];
    const { data, error } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`[documentsRepo.listByWorkspace] ${error.message}`);
    return (data || []).map(d => ({
      _id: d.id,
      id: d.id,
      documentId: d.id,
      workspaceId: d.workspace_id,
      fileName: d.file_name,
      fileSize: d.file_size,
      parserUsed: d.parser_used,
      summary: d.summary,
      extractedTransactions: d.extracted_transactions,
      createdAt: d.created_at
    }));
  },

  async delete(id) {
    const { error } = await supabase.from('uploaded_documents').delete().eq('id', id);
    if (error) throw new Error(`[documentsRepo.delete] ${error.message}`);
    return true;
  },

  async deleteByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('uploaded_documents')
      .delete()
      .eq('workspace_id', workspaceId)
      .select('id');

    if (error) throw new Error(`[documentsRepo.deleteByWorkspace] ${error.message}`);
    return (data || []).length;
  }
};

// ─── 5. INVOICES & KHATA REPOSITORIES ────────────────────────────────────────
export const invoicesRepo = {
  async listByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false });

    if (error) throw new Error(`[invoicesRepo.listByWorkspace] ${error.message}`);
    return (data || []).map(i => ({
      _id: i.id,
      id: i.id,
      invoiceNumber: i.invoice_number,
      customerName: i.customer_name,
      totalAmount: Number(i.total_amount || 0),
      paidAmount: Number(i.paid_amount || 0),
      status: i.status || 'unpaid',
      date: i.date,
      dueDate: i.due_date,
      items: i.items || []
    }));
  }
};

export const khataRepo = {
  async listByWorkspace(workspaceId) {
    const { data, error } = await supabase
      .from('khata_ledgers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('party_name', { ascending: true });

    if (error) throw new Error(`[khataRepo.listByWorkspace] ${error.message}`);
    return (data || []).map(k => ({
      _id: k.id,
      id: k.id,
      partyName: k.party_name,
      partyType: k.party_type,
      phone: k.phone,
      currentBalance: Number(k.current_balance || 0),
      creditLimit: Number(k.credit_limit || 0),
      entries: k.entries || []
    }));
  }
};

// ─── 6. DEVICE SESSIONS REPOSITORY ───────────────────────────────────────────
export const deviceSessionsRepo = {
  async upsert({ userId, deviceId, deviceName = 'Web Browser', platform = 'Web', ipAddress = '127.0.0.1' }) {
    const { data: existing } = await supabase
      .from('device_sessions')
      .select('id, is_primary')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('device_sessions')
        .update({ last_active_at: new Date().toISOString(), status: 'active' })
        .eq('id', existing.id);
      return existing;
    }

    // Check count of existing active sessions
    const { count } = await supabase
      .from('device_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const isPrimary = (count || 0) === 0;

    const { data, error } = await supabase
      .from('device_sessions')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName,
        platform,
        ip_address: ipAddress,
        is_primary: isPrimary,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`[deviceSessionsRepo.upsert] ${error.message}`);
    return data;
  },

  async listByUser(userId) {
    const { data, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (error) throw new Error(`[deviceSessionsRepo.listByUser] ${error.message}`);
    return data || [];
  },

  async revoke(userId, deviceId) {
    const { error } = await supabase
      .from('device_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (error) throw new Error(`[deviceSessionsRepo.revoke] ${error.message}`);
    return true;
  }
};

// ─── 7. OTP VERIFICATIONS REPOSITORY ─────────────────────────────────────────
export const otpRepo = {
  async saveOtp({ email, phone, code, purpose = 'signup', expiresInMinutes = 10 }) {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Invalidate old unverified OTPs
    if (cleanEmail) {
      await supabase.from('otp_verifications').delete().eq('email', cleanEmail);
    }

    const { data, error } = await supabase
      .from('otp_verifications')
      .insert({
        email: cleanEmail,
        phone: phone || null,
        code: String(code),
        purpose,
        expires_at: expiresAt,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw new Error(`[otpRepo.saveOtp] ${error.message}`);
    return data;
  },

  async verifyOtp({ email, code, purpose = 'signup' }) {
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', String(code).trim())
      .gt('expires_at', now)
      .maybeSingle();

    if (error || !data) return false;

    // Mark verified
    await supabase.from('otp_verifications').update({ is_verified: true }).eq('id', data.id);
    return true;
  }
};

// ─── 8. MERCHANT MAPPINGS REPOSITORY ─────────────────────────────────────────
export const merchantMappingsRepo = {
  async getMappings(workspaceId) {
    const { data, error } = await supabase
      .from('merchant_mappings')
      .select('*')
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);

    if (error) return [];
    return data || [];
  },

  async saveMapping({ workspaceId, rawPattern, cleanMerchant, category, confidence = 0.95 }) {
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
  }
};

// ─── 9. COMPLETE GDPR ACCOUNT PURGE ──────────────────────────────────────────
export async function purgeUserAccountAndAllData(userId) {
  if (!userId) return false;

  // 1. Find all owned workspaces
  const { data: ownedWs } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId);

  const wsIds = (ownedWs || []).map(w => w.id);

  // 2. Cascade delete all tables in Supabase
  await Promise.all([
    supabase.from('transactions').delete().in('workspace_id', wsIds),
    supabase.from('uploaded_documents').delete().in('workspace_id', wsIds),
    supabase.from('invoices').delete().in('workspace_id', wsIds),
    supabase.from('bills').delete().in('workspace_id', wsIds),
    supabase.from('khata_ledgers').delete().in('workspace_id', wsIds),
    supabase.from('accounts').delete().in('workspace_id', wsIds),
    supabase.from('journal_entries').delete().in('workspace_id', wsIds),
    supabase.from('fixed_assets').delete().in('workspace_id', wsIds),
    supabase.from('payroll_records').delete().in('workspace_id', wsIds),
    supabase.from('projects').delete().in('workspace_id', wsIds),
    supabase.from('recurring_subscriptions').delete().in('workspace_id', wsIds),
    supabase.from('business_calendar_events').delete().in('workspace_id', wsIds),
    supabase.from('hero_insights').delete().in('workspace_id', wsIds),
    supabase.from('device_sessions').delete().eq('user_id', userId),
    supabase.from('workspace_members').delete().eq('user_id', userId),
    supabase.from('workspaces').delete().eq('owner_id', userId),
    supabase.from('users').delete().eq('id', userId)
  ]);

  console.log(`[Supabase Purge] User ${userId} and all workspace records permanently deleted.`);
  return true;
}
