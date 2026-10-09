import { registerUser, verifyAndCreateAccount, resendVerificationCode, authenticateUser } from './auth.service.js';
import { usersRepo, workspacesRepo, purgeUserAccountAndAllData } from '../../db/supabaseDb.js';
import { validate, isValidEmail } from '../../utils/validation.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

export async function signup(req, res, next) {
  try {
    const { fullName, email, password, workspaceChoice, businessName, industry } = req.body;
    
    const valResult = validate(req.body, {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string', minLength: 6 }
    });

    if (!valResult.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: valResult.errors.join(' ')
      });
    }

    const result = await registerUser({ fullName, email, password, workspaceChoice, businessName, industry });
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function verifyCode(req, res, next) {
  try {
    const { email, password, fullName, workspaceChoice, businessName, industry } = req.body;
    const code = req.body.otp || req.body.code;

    if (!email || !code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Email and verification code are required.'
      });
    }

    const result = await verifyAndCreateAccount({
      email,
      code,
      password,
      fullName,
      workspaceChoice,
      businessName,
      industry
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account verified successfully!',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function resendCode(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Valid email is required.'
      });
    }

    const result = await resendVerificationCode(email);
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Email and password are required.'
      });
    }

    const result = await authenticateUser(email, password);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Signed in successfully!',
      ...result
    });
  } catch (err) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.INVALID_CREDENTIALS,
      error: err.message
    });
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await usersRepo.findById(req.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        error: 'User not found.'
      });
    }

    const workspaces = await workspacesRepo.getUserWorkspaces(req.userId);
    const activeWsId = req.headers['x-workspace-id'];
    let activeWs = workspaces.find(w => w.id === activeWsId || w._id === activeWsId) || workspaces[0] || null;

    return res.status(HTTP_STATUS.OK).json({
      id: user.id,
      _id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const result = await purgeUserAccountAndAllData(req.userId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account and associated records permanently purged.',
      ...result
    });
  } catch (err) {
    next(err);
  }
}
