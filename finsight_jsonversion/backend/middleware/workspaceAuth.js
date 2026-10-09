import { workspacesRepo } from '../db/supabaseDb.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

/**
 * Workspace Multi-Tenant Authorization Middleware
 * Verifies that the authenticated user is an authorized owner or member of the requested workspace.
 */
export async function requireWorkspaceAccess(req, res, next) {
  try {
    const rawWsId = req.params.workspaceId || 
                    req.params.businessId || 
                    req.query.workspaceId || 
                    req.headers['x-workspace-id'] || 
                    'personal';
                    
    const workspaceId = String(rawWsId).trim();
    req.workspaceId = workspaceId;

    // 'personal' is the user's default workspace scope
    if (workspaceId === 'personal' || workspaceId === '') {
      req.userRole = 'owner';
      return next();
    }

    // Verify workspace membership against authorized workspaces for this user
    const userWorkspaces = await workspacesRepo.getUserWorkspaces(req.userId);
    const matchedWs = userWorkspaces.find(ws => 
      ws.id === workspaceId || 
      ws._id === workspaceId || 
      (ws.businessId && ws.businessId === workspaceId)
    );

    if (!matchedWs) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        code: ERROR_CODES.WORKSPACE_FORBIDDEN,
        error: 'Access denied. You are not an authorized member of this workspace.'
      });
    }

    req.userRole = matchedWs.role || 'owner';
    req.activeWorkspace = matchedWs;
    next();
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      code: ERROR_CODES.INTERNAL_ERROR,
      error: 'Failed to verify workspace permissions: ' + err.message
    });
  }
}
