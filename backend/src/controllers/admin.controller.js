import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { privateUser } from '../utils/serializers.js';

export const getStats = asyncHandler(async (req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, newUsers, totalConnections, totalMessages, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.count({ where: { createdAt: { gt: weekAgo } } }),
    prisma.connection.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  res.json({ totalUsers, activeUsers, newUsers, totalConnections, totalMessages, pendingReports });
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ username: { contains: q } }, { email: { contains: q } }, { fullName: { contains: q } }] } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ users: users.map(privateUser) });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot suspend an admin account');

  const updated = await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } });
  res.json({ user: privateUser(updated) });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
  res.json({ user: privateUser(updated) });
});

export const listReports = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    include: { reporter: true, reported: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      resolutionNote: r.resolutionNote,
      reporter: privateUser(r.reporter),
      reported: privateUser(r.reported),
    })),
  });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { status, resolutionNote } = req.body; // RESOLVED | DISMISSED
  if (!['RESOLVED', 'DISMISSED'].includes(status)) throw new ApiError(400, 'Invalid status');

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) throw new ApiError(404, 'Report not found');

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { status, resolutionNote: resolutionNote || null, resolvedAt: new Date() },
  });

  res.json({ report: updated });
});
