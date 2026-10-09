import { 
  registerUser, 
  verifyAndCreateAccount, 
  resendVerificationCode, 
  authenticateUser,
  authenticateGoogleUser,
  requestPasswordReset,
  resetPasswordWithOtp
} from './auth.service.js';
import { usersRepo, workspacesRepo, purgeUserAccountAndAllData } from '../../db/supabaseDb.js';
import { validate, isValidEmail } from '../../utils/validation.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { revokeToken } from '../../middleware/auth.js';

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
    const valResult = validate(req.body, {
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string', minLength: 1 }
    });

    if (!valResult.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: valResult.errors.join(' ')
      });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const password = String(req.body.password);

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
      error: 'Invalid email or password.'
    });
  }
}

export async function logout(req, res) {
  if (req.token) {
    revokeToken(req.token);
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Signed out successfully. Session revoked.'
  });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Valid email is required.'
      });
    }

    const result = await requestPasswordReset(email);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    const code = req.body.code || req.body.otp;

    const valResult = validate(req.body, {
      email: { required: true, type: 'email' },
      newPassword: { required: true, type: 'string', minLength: 6 }
    });

    if (!valResult.isValid || !code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: !code ? 'Verification code is required.' : valResult.errors.join(' ')
      });
    }

    const result = await resetPasswordWithOtp({ email, code, newPassword });
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      code: ERROR_CODES.VALIDATION_FAILED,
      error: err.message || 'Password reset failed.'
    });
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken, token } = req.body;
    const finalToken = idToken || token;
    if (!finalToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        error: 'Google ID token is required.'
      });
    }

    const result = await authService.authenticateGoogleUser(finalToken);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Google authentication successful!',
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
      fullName: user.fullName || user.full_name,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces,
      personalWorkspaces: workspaces.filter(w => w.type === 'personal'),
      businessWorkspaces: workspaces.filter(w => w.type === 'business')
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

