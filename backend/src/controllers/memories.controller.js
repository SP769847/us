import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';

function serialize(memory) {
  return { ...memory, photos: memory.photos ? JSON.parse(memory.photos) : [] };
}

export const createMemory = asyncHandler(async (req, res) => {
  const { title, description, location, eventDate, connectionId } = req.body;
  if (!title || !eventDate) throw new ApiError(400, 'Title and date are required');

  if (connectionId) {
    const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection || (connection.userAId !== req.user.id && connection.userBId !== req.user.id)) {
      throw new ApiError(403, 'Invalid connection');
    }
  }

  const photos = (req.files || []).map((f) => `/uploads/memories/${f.filename}`);

  const memory = await prisma.memory.create({
    data: {
      userId: req.user.id,
      connectionId: connectionId || null,
      title: sanitizeText(title, 150),
      description: description ? sanitizeText(description, 2000) : null,
      location: location ? sanitizeText(location, 150) : null,
      eventDate: new Date(eventDate),
      photos: JSON.stringify(photos),
    },
  });

  res.status(201).json({ memory: serialize(memory) });
});

export const listMemories = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.connectionId) where.connectionId = req.query.connectionId;

  const memories = await prisma.memory.findMany({ where, orderBy: { eventDate: 'desc' } });
  res.json({ memories: memories.map(serialize) });
});

export const getMemory = asyncHandler(async (req, res) => {
  const memory = await prisma.memory.findUnique({ where: { id: req.params.id } });
  if (!memory || memory.userId !== req.user.id) throw new ApiError(404, 'Memory not found');
  res.json({ memory: serialize(memory) });
});

export const updateMemory = asyncHandler(async (req, res) => {
  const memory = await prisma.memory.findUnique({ where: { id: req.params.id } });
  if (!memory || memory.userId !== req.user.id) throw new ApiError(404, 'Memory not found');

  const data = {};
  if (req.body.title !== undefined) data.title = sanitizeText(req.body.title, 150);
  if (req.body.description !== undefined) data.description = sanitizeText(req.body.description, 2000);
  if (req.body.location !== undefined) data.location = sanitizeText(req.body.location, 150);
  if (req.body.eventDate !== undefined) data.eventDate = new Date(req.body.eventDate);

  if (req.files?.length) {
    const existing = memory.photos ? JSON.parse(memory.photos) : [];
    data.photos = JSON.stringify([...existing, ...req.files.map((f) => `/uploads/memories/${f.filename}`)]);
  }

  const updated = await prisma.memory.update({ where: { id: memory.id }, data });
  res.json({ memory: serialize(updated) });
});

export const deleteMemory = asyncHandler(async (req, res) => {
  const memory = await prisma.memory.findUnique({ where: { id: req.params.id } });
  if (!memory || memory.userId !== req.user.id) throw new ApiError(404, 'Memory not found');
  await prisma.memory.delete({ where: { id: memory.id } });
  res.json({ message: 'Memory deleted' });
});
