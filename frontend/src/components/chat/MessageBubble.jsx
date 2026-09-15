import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaUrl } from '../../utils/media.js';

const REACTIONS = ['❤️', '😂', '🥰', '😮', '😢', '👍'];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isMine, myId, onReact, onDelete, onPin, onReply }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const myReaction = message.reactions?.find((r) => r.userId === myId)?.emoji;
  const reactionCounts = {};
  (message.reactions || []).forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return (
    <div
      className={`group flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''} relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className={`max-w-[78%] sm:max-w-[60%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {message.replyTo && (
          <div className={`text-[11px] text-white/40 mb-1 px-3 border-l-2 border-white/20 ${isMine ? 'text-right' : ''}`}>
            Replying to: {message.replyTo.content?.slice(0, 60) || (message.replyTo.type === 'IMAGE' ? 'a photo' : '')}
          </div>
        )}

        {message.isDeleted ? (
          <div className="italic text-xs text-white/30 bg-white/[0.03] rounded-2xl px-4 py-2.5 border border-white/5">
            Message deleted
          </div>
        ) : message.type === 'IMAGE' ? (
          <img
            src={mediaUrl(message.attachmentUrl)}
            alt="Shared"
            className="max-w-full rounded-2xl border border-white/10 max-h-72 object-cover"
          />
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
              isMine
                ? 'bg-gradient-to-br from-blush-500 to-plum-500 text-white rounded-br-sm'
                : 'bg-white/8 text-white/90 rounded-bl-sm'
            }`}
          >
            {message.content}
          </div>
        )}

        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={`text-[11px] rounded-full px-1.5 py-0.5 border ${
                  myReaction === emoji ? 'bg-blush-500/20 border-blush-400/40' : 'bg-white/5 border-white/10'
                }`}
              >
                {emoji} {count > 1 && count}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] text-white/25">{formatTime(message.createdAt)}</span>
          {message.isPinned && <span className="text-[10px]">📌</span>}
        </div>
      </div>

      <AnimatePresence>
        {showActions && !message.isDeleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative flex items-center gap-0.5 bg-ink-900 border border-white/10 rounded-full px-1 py-1 shadow-soft"
          >
            <button
              onClick={() => setShowReactions((v) => !v)}
              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-white/10 rounded-full"
              title="React"
            >
              😊
            </button>
            <button
              onClick={() => onReply(message)}
              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-white/10 rounded-full"
              title="Reply"
            >
              ↩️
            </button>
            <button
              onClick={() => onPin(message.id)}
              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-white/10 rounded-full"
              title="Pin"
            >
              📌
            </button>
            {isMine && (
              <button
                onClick={() => onDelete(message.id)}
                className="w-6 h-6 flex items-center justify-center text-xs hover:bg-white/10 rounded-full"
                title="Delete"
              >
                🗑️
              </button>
            )}

            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className={`absolute -top-11 ${isMine ? 'right-0' : 'left-0'} bg-ink-900 border border-white/10 rounded-full px-1.5 py-1 flex gap-1 shadow-soft`}
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowReactions(false);
                      }}
                      className="text-sm hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
