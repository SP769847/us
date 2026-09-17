import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { requireMembership } from '../services/chatService.js';
import { getWaitingReplyStatus, sendWaitingReplyReminder } from '../services/waitingReply.js';

export const getStatus = asyncHandler(async (req, res) => {
  await requireMembership(req.params.conversationId, req.user.id);
  const status = await getWaitingReplyStatus(req.params.conversationId, req.user.id);
  res.json(status);
});

export const remind = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  await requireMembership(conversationId, req.user.id);

  const status = await getWaitingReplyStatus(conversationId, req.user.id);
  if (!status.waiting) {
    throw new ApiError(400, 'There is nothing to remind them about right now');
  }
  if (!status.canRemind) {
    throw new ApiError(429, status.alreadyReminded ? "You've already sent a reminder for this." : 'Please wait a little before sending another reminder.');
  }

  const result = await sendWaitingReplyReminder({
    conversationId,
    senderId: req.user.id,
    recipientId: status.recipientId,
    messageId: status.messageId,
  });

  if (!result.sent) {
    throw new ApiError(429, "You've already sent a reminder for this.");
  }

  res.json({ sent: true });
});
