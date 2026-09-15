import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';

const MILESTONE_TYPES = new Set(['FIRST_CONVERSATION', 'FIRST_MEETING', 'FIRST_DATE', 'ANNIVERSARY', 'BIRTHDAY', 'SPECIAL_DAY', 'FAVOURITE_MEMORY', 'CUSTOM']);

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, eventDate, milestoneType, connectionId } = req.body;
  if (!title || !eventDate) throw new ApiError(400, 'Title and date are required');

  const event = await prisma.timelineEvent.create({
    data: {
      userId: req.user.id,
      connectionId: connectionId || null,
      title: sanitizeText(title, 150),
      description: description ? sanitizeText(description, 2000) : null,
      eventDate: new Date(eventDate),
      milestoneType: MILESTONE_TYPES.has(milestoneType) ? milestoneType : 'CUSTOM',
      imageUrl: req.file ? `/uploads/timeline/${req.file.filename}` : null,
    },
  });

  res.status(201).json({ event });
});

export const listEvents = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.connectionId) where.connectionId = req.query.connectionId;
  const events = await prisma.timelineEvent.findMany({ where, orderBy: { eventDate: 'asc' } });
  res.json({ events });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await prisma.timelineEvent.findUnique({ where: { id: req.params.id } });
  if (!event || event.userId !== req.user.id) throw new ApiError(404, 'Event not found');

  const data = {};
  if (req.body.title !== undefined) data.title = sanitizeText(req.body.title, 150);
  if (req.body.description !== undefined) data.description = sanitizeText(req.body.description, 2000);
  if (req.body.eventDate !== undefined) data.eventDate = new Date(req.body.eventDate);
  if (req.body.milestoneType !== undefined && MILESTONE_TYPES.has(req.body.milestoneType)) data.milestoneType = req.body.milestoneType;
  if (req.file) data.imageUrl = `/uploads/timeline/${req.file.filename}`;

  const updated = await prisma.timelineEvent.update({ where: { id: event.id }, data });
  res.json({ event: updated });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.timelineEvent.findUnique({ where: { id: req.params.id } });
  if (!event || event.userId !== req.user.id) throw new ApiError(404, 'Event not found');
  await prisma.timelineEvent.delete({ where: { id: event.id } });
  res.json({ message: 'Event deleted' });
});
