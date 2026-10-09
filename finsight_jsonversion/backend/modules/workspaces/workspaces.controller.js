import * as workspacesService from './workspaces.service.js';
import { workspacesRepo } from '../../db/supabaseDb.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

export async function getWorkspaces(req, res, next) {
  try {
    const list = await workspacesService.getUserWorkspaces(req.userId);
    return res.status(HTTP_STATUS.OK).json(list);
  } catch (err) {
    next(err);
  }
}

export async function createWorkspace(req, res, next) {
  try {
    const ws = await workspacesService.createWorkspace(req.userId, req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Workspace created successfully!',
      workspace: ws
    });
  } catch (err) {
    next(err);
  }
}

export async function joinWorkspace(req, res, next) {
  try {
    const { code, joinCode } = req.body;
    const finalCode = code || joinCode;
    if (!finalCode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Join code is required.'
      });
    }

    const ws = await workspacesService.joinWorkspaceByCode(req.userId, finalCode);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Joined workspace "${ws.name}" successfully!`,
      workspace: ws
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkspaceById(req, res, next) {
  try {
    const wsId = req.params.workspaceId || req.params.businessId;
    const ws = await workspacesRepo.findById(wsId);
    if (!ws) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        error: 'Workspace not found.'
      });
    }
    return res.status(HTTP_STATUS.OK).json(ws);
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req, res, next) {
  try {
    const wsId = req.params.workspaceId || req.params.businessId;
    const members = await workspacesService.getWorkspaceMembers(wsId);
    return res.status(HTTP_STATUS.OK).json(members);
  } catch (err) {
    next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const wsId = req.params.workspaceId || req.params.businessId;
    const member = await workspacesService.addWorkspaceMember(wsId, req.body, req.userRole);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Member added successfully!',
      member
    });
  } catch (err) {
    next(err);
  }
}

export async function resetData(req, res, next) {
  try {
    const wsId = req.params.workspaceId || req.params.id;
    const result = await workspacesService.resetWorkspaceData(wsId, req.userId);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}
