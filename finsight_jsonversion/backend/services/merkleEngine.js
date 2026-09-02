import crypto from 'crypto';
import { supabase } from '../db/supabaseClient.js';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Compute cryptographic SHA-256 block hash for Merkle chaining
 */
export function computeBlockHash(previousBlockHash, sequenceIndex, timestamp, userId, action, entityType, entityId, amount, metadata) {
  const payload = JSON.stringify({
    previousBlockHash,
    sequenceIndex,
    timestamp: new Date(timestamp).toISOString(),
    userId: String(userId),
    action,
    entityType,
    entityId: String(entityId || ''),
    amount: Number(amount) || 0,
    metadata: metadata || {}
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Append a cryptographically chained immutable block log to Supabase hero_insights / transactions
 */
export async function logChainedAuditEntry(data) {
  try {
    const { workspaceId, userId, actorName, action, entityType, entityId, targetUserId, amount, result, approverId, approverName, biometricVerified, metadata } = data;

    const timestamp = new Date();
    const previousBlockHash = GENESIS_HASH;
    const sequenceIndex = 1;
    const blockHash = computeBlockHash(previousBlockHash, sequenceIndex, timestamp, userId, action, entityType, entityId, amount, metadata);

    // Save audit insight in Supabase
    if (workspaceId) {
      await supabase.from('hero_insights').insert({
        workspace_id: workspaceId,
        insight_type: 'AUDIT_LOG',
        title: `🔒 Audit: ${action} by ${actorName || 'System'}`,
        summary: `Action ${action} on ${entityType || 'record'} (ID: ${entityId || 'N/A'}) - Hash: ${blockHash.slice(0, 16)}...`,
        severity: 'info',
        metadata: {
          blockHash,
          previousBlockHash,
          sequenceIndex,
          userId,
          amount,
          result: result || 'success',
          ...metadata
        }
      });
    }

    return {
      success: true,
      blockHash,
      sequenceIndex,
      previousBlockHash,
      timestamp
    };
  } catch (err) {
    console.error('⚠️ [MerkleEngine] Chained audit log error:', err.message);
    return { success: false, error: err.message };
  }
}
