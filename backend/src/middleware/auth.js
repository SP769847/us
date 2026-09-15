import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../config/prisma.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new ApiError(401, 'Invalid session');
    }
    if (user.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, 'Invalid or expired session'));
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
}
