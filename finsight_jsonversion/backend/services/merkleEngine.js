import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

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
 * Append a cryptographically chained immutable block log to MongoDB Audit System
 */
export async function logChainedAuditEntry(data) {
  try {
    const { businessId, userId, actorName, action, entityType, entityId, targetUserId, amount, result, approverId, approverName, biometricVerified, metadata } = data;

    // Fetch previous block in chain for this workspace/system
    const filter = businessId ? { businessId } : {};
    const lastLog = await AuditLog.findOne(filter).sort({ sequenceIndex: -1, createdAt: -1 }).lean();

    const sequenceIndex = lastLog ? (lastLog.sequenceIndex || 0) + 1 : 1;
    const previousBlockHash = lastLog && lastLog.blockHash ? lastLog.blockHash : GENESIS_HASH;
    const timestamp = new Date();

    const blockHash = computeBlockHash(previousBlockHash, sequenceIndex, timestamp, userId, action, entityType, entityId, amount, metadata);

    const logEntry = new AuditLog({
      businessId,
      userId,
      actorName,
      action,
      entityType,
      entityId,
      targetUserId,
      amount,
      result: result || 'success',
      approverId,
      approverName,
      approvalTime: approverId ? timestamp : undefined,
      biometricVerified: Boolean(biometricVerified),
      sequenceIndex,
      previousBlockHash,
      blockHash,
      metadata,
      createdAt: timestamp
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    console.error('⚠️ [MerkleEngine] Failed to create chained audit log:', err.message);
    throw err;
  }
}

/**
 * Verify Merkle Chain integrity across MongoDB audit records
 * Checks for any broken links or modified data entries in DB
 */
export async function verifyMerkleChainIntegrity(businessId = null) {
  try {
    const filter = businessId ? { businessId } : {};
    const logs = await AuditLog.find(filter).sort({ sequenceIndex: 1, createdAt: 1 }).lean();

    if (logs.length === 0) {
      return { verified: true, count: 0, status: 'EMPTY_CHAIN', message: 'No records in audit chain.' };
    }

    let expectedPrevHash = GENESIS_HASH;
    const tamperedBlocks = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify previous block hash link
      if (log.previousBlockHash !== expectedPrevHash) {
        tamperedBlocks.push({
          index: log.sequenceIndex || i + 1,
          logId: log._id,
          reason: `Broken chain link: Expected previous hash ${expectedPrevHash.substring(0, 16)}... but found ${log.previousBlockHash.substring(0, 16)}...`,
        });
      }

      // Re-calculate expected hash
      const recomputedHash = computeBlockHash(
        log.previousBlockHash,
        log.sequenceIndex || i + 1,
        log.createdAt,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.amount,
        log.metadata
      );

      if (log.blockHash !== recomputedHash) {
        tamperedBlocks.push({
          index: log.sequenceIndex || i + 1,
          logId: log._id,
          reason: `Data Tamper Detected! Block hash ${log.blockHash.substring(0, 16)}... does not match payload hash ${recomputedHash.substring(0, 16)}...`,
        });
      }

      expectedPrevHash = log.blockHash;
    }

    const isIntact = tamperedBlocks.length === 0;

    return {
      verified: isIntact,
      count: logs.length,
      status: isIntact ? 'CHAIN_INTACT_SECURE' : 'TAMPER_DETECTED',
      latestBlockHash: expectedPrevHash,
      tamperedBlocksCount: tamperedBlocks.length,
      tamperedDetails: tamperedBlocks,
      message: isIntact
        ? `✅ Merkle chain verified across ${logs.length} blocks. 100% Immutable.`
        : `⚠️ TAMPER ALERT! ${tamperedBlocks.length} invalid block(s) detected in database.`,
    };
  } catch (err) {
    console.error('⚠️ [MerkleEngine] Chain integrity verification failed:', err.message);
    return { verified: false, error: err.message };
  }
}
