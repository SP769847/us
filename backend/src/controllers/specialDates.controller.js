import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';

function nextOccurrence(date, isRecurringYearly) {
  const now = new Date();
  const target = new Date(date);
  if (!isRecurringYearly) return target;

  const next = new Date(now.getFullYear(), target.getMonth(), target.getDate());
  if (next < now) next.setFullYear(next.getFullYear() + 1);
  return next;
}

function serialize(sd) {
  const next = nextOccurrence(sd.date, sd.isRecurringYearly);
  const daysUntil = Math.ceil((next - new Date()) / (1000 * 60 * 60 * 24));
  return { ...sd, nextOccurrence: next, daysUntil };
}

export const createSpecialDate = asyncHandler(async (req, res) => {
  const { title, date, isRecurringYearly, connectionId } = req.body;
  if (!title || !date) throw new ApiError(400, 'Title and date are required');

  const specialDate = await prisma.specialDate.create({
    data: {
      userId: req.user.id,
      connectionId: connectionId || null,
      title: sanitizeText(title, 150),
      date: new Date(date),
      isRecurringYearly: Boolean(isRecurringYearly),
    },
  });

  res.status(201).json({ specialDate: serialize(specialDate) });
});

export const listSpecialDates = asyncHandler(async (req, res) => {
  const dates = await prisma.specialDate.findMany({ where: { userId: req.user.id } });
  const serialized = dates.map(serialize).sort((a, b) => a.daysUntil - b.daysUntil);
  res.json({ specialDates: serialized });
});

export const deleteSpecialDate = asyncHandler(async (req, res) => {
  const sd = await prisma.specialDate.findUnique({ where: { id: req.params.id } });
  if (!sd || sd.userId !== req.user.id) throw new ApiError(404, 'Special date not found');
  await prisma.specialDate.delete({ where: { id: sd.id } });
  res.json({ message: 'Deleted' });
});
