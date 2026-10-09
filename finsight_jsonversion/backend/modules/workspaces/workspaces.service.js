import { workspacesRepo, staffRepo, transactionsRepo, documentsRepo } from '../../db/supabaseDb.js';
import { generateJoinCode } from '../auth/auth.service.js';

export async function getUserWorkspaces(userId) {
  return await workspacesRepo.getUserWorkspaces(userId);
}

export async function createWorkspace(userId, { name, type = 'personal', businessName, industry }) {
  const wsName = name || (type === 'business' && businessName ? businessName : 'My Workspace');
  const ws = await workspacesRepo.create({
    name: wsName,
    type: type === 'business' ? 'business' : 'personal',
    ownerId: userId,
    businessName: businessName || null,
    industry: industry || null,
    joinCode: generateJoinCode()
  });
  return ws;
}

export async function joinWorkspaceByCode(userId, joinCode) {
  const cleanCode = String(joinCode || '').trim().toUpperCase();
  const ws = await workspacesRepo.findByJoinCode(cleanCode);
  if (!ws) {
    throw new Error('Invalid workspace join code. Please check with your business owner.');
  }

  // Add user as employee
  await workspacesRepo.addMember(ws.id, userId, 'employee');
  return ws;
}

export async function getWorkspaceMembers(workspaceId) {
  return await workspacesRepo.getMembers(workspaceId);
}

export async function addWorkspaceMember(workspaceId, memberData, callerRole) {
  if (callerRole && callerRole !== 'owner' && callerRole !== 'admin') {
    throw new Error('Access denied. Only workspace owners and admins can add members.');
  }
  return await staffRepo.create({
    workspaceId,
    ...memberData
  });
}

export async function resetWorkspaceData(workspaceId, userId) {
  // Enforce data reset strictly by workspace owner
  const [ws, members] = await Promise.all([
    workspacesRepo.findById(workspaceId),
    workspacesRepo.getMembers(workspaceId)
  ]);

  const isOwner = (ws && (ws.ownerId === userId || ws.owner_id === userId)) ||
                  members.some(m => (m.userId === userId || m.user_id === userId) && m.role === 'owner');

  if (!isOwner) {
    throw new Error('Access denied. Only the workspace owner can reset workspace data.');
  }
  
  // Wipe transactions and documents scoped to this workspace
  await transactionsRepo.deleteByWorkspace(workspaceId);
  await documentsRepo.deleteByWorkspace(workspaceId);

  return { success: true, message: 'Workspace transactions and documents have been reset.' };
}
