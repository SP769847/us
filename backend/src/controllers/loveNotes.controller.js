import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { areConnected } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sanitizeText } from '../utils/validators.js';

const READ_THIS_WHEN_CATEGORIES = new Set(['SAD', 'MISS_ME', 'ANGRY', 'CANT_SLEEP', 'NEED_LOVE', 'MOTIVATION', 'CUSTOM']);

export const createLoveNote = asyncHandler(async (req, res) => {
  const { recipientUsername, title, message, unlockAt, kind, category } = req.body;
  const recipient = await prisma.user.findUnique({ where: { username: (recipientUsername || '').toLowerCase() } });
  if (!recipient) throw new ApiError(404, 'Recipient not found');
  if (!(await areConnected(req.user.id, recipient.id))) {
    throw new ApiError(403, 'You can only send love notes to your connections');
  }
  if (!title || !message) throw new ApiError(400, 'Title and message are required');

  const resolvedKind = kind === 'READ_THIS_WHEN' ? 'READ_THIS_WHEN' : 'LOVE_NOTE';
  if (resolvedKind === 'READ_THIS_WHEN' && !READ_THIS_WHEN_CATEGORIES.has(category)) {
    throw new ApiError(400, 'Please select a valid category');
  }

  const imageUrl = req.file ? `/uploads/love-notes/${req.file.filename}` : null;

  const note = await prisma.loveNote.create({
    data: {
      senderId: req.user.id,
      recipientId: recipient.id,
      kind: resolvedKind,
      category: resolvedKind === 'READ_THIS_WHEN' ? category : null,
      title: sanitizeText(title, 120),
      message: sanitizeText(message, 3000),
      imageUrl,
      unlockAt: unlockAt ? new Date(unlockAt) : null,
    },
  });

  await createNotification({
    recipientId: recipient.id,
    type: resolvedKind === 'READ_THIS_WHEN' ? 'READ_THIS_WHEN' : 'NEW_LOVE_NOTE',
    title: resolvedKind === 'READ_THIS_WHEN' ? 'A note for when you need it 💕' : 'You received a love note 💌',
    body: note.title,
    data: { noteId: note.id },
  });

  res.status(201).json({ note });
});

function serializeNote(note, viewerId) {
  const isRecipient = note.recipientId === viewerId;
  const locked = isRecipient && note.unlockAt && new Date(note.unlockAt) > new Date();
  return {
    id: note.id,
    kind: note.kind,
    category: note.category,
    title: note.title,
    message: locked ? null : note.message,
    imageUrl: locked ? null : note.imageUrl,
    unlockAt: note.unlockAt,
    locked,
    createdAt: note.createdAt,
    sender: publicUser(note.sender),
    recipient: publicUser(note.recipient),
    direction: isRecipient ? 'RECEIVED' : 'SENT',
  };
}

export const listLoveNotes = asyncHandler(async (req, res) => {
  const kind = req.query.kind === 'READ_THIS_WHEN' ? 'READ_THIS_WHEN' : 'LOVE_NOTE';
  const notes = await prisma.loveNote.findMany({
    where: { kind, OR: [{ senderId: req.user.id }, { recipientId: req.user.id }] },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ notes: notes.map((n) => serializeNote(n, req.user.id)) });
});

export const getLoveNote = asyncHandler(async (req, res) => {
  const note = await prisma.loveNote.findUnique({
    where: { id: req.params.id },
    include: { sender: true, recipient: true },
  });
  if (!note || (note.senderId !== req.user.id && note.recipientId !== req.user.id)) {
    throw new ApiError(404, 'Note not found');
  }
  res.json({ note: serializeNote(note, req.user.id) });
});

export const deleteLoveNote = asyncHandler(async (req, res) => {
  const note = await prisma.loveNote.findUnique({ where: { id: req.params.id } });
  if (!note || note.senderId !== req.user.id) throw new ApiError(404, 'Note not found');
  await prisma.loveNote.delete({ where: { id: note.id } });
  res.json({ message: 'Note deleted' });
});
