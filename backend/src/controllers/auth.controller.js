import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';
import { isValidEmail, isValidUsername, isStrongPassword, sanitizeText } from '../utils/validators.js';
import { privateUser } from '../utils/serializers.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function setAuthCookie(res, userId) {
  const token = signToken({ sub: userId });
  res.cookie('token', token, COOKIE_OPTIONS);
}

export const register = asyncHandler(async (req, res) => {
  const fullName = sanitizeText(req.body.fullName, 100);
  const username = sanitizeText(req.body.username, 20)?.toLowerCase();
  const email = sanitizeText(req.body.email, 254)?.toLowerCase();
  const { password, confirmPassword } = req.body;

  if (!fullName || !username || !email || !password || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }
  if (!isValidEmail(email)) throw new ApiError(400, 'Please enter a valid email address');
  if (!isValidUsername(username)) {
    throw new ApiError(400, 'Username must be 3-20 characters, letters/numbers/underscore only');
  }
  if (!isStrongPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number');
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new ApiError(409, existing.email === email ? 'An account with this email already exists' : 'This username is already taken');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let avatarUrl = null;
  if (req.file) {
    avatarUrl = `/uploads/avatars/${req.file.filename}`;
  }

  const user = await prisma.user.create({
    data: { fullName, username, email, passwordHash, avatarUrl },
  });

  setAuthCookie(res, user.id);
  res.status(201).json({ user: privateUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const identifier = sanitizeText(req.body.identifier, 254)?.toLowerCase();
  const { password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, 'Please provide your email/username and password');
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }
  if (user.status === 'SUSPENDED') {
    throw new ApiError(403, 'Your account has been suspended');
  }

  setAuthCookie(res, user.id);
  res.json({ user: privateUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: privateUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = sanitizeText(req.body.email, 254)?.toLowerCase();
  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, 'Please enter a valid email address');
  }

  const genericResponse = { message: 'If an account exists for that email, a reset link has been generated.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // No transactional email provider is configured in this project yet.
  // In development we log the reset link so the flow is fully testable end-to-end.
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  console.log(`[password reset] ${email} -> ${resetLink}`);

  const payload = { ...genericResponse };
  if (process.env.NODE_ENV !== 'production') {
    payload.devResetToken = rawToken;
    payload.devResetLink = resetLink;
  }
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }
  if (!isStrongPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!resetToken) {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ message: 'Password has been reset. You can now log in.' });
});
