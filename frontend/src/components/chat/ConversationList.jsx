import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import { Input } from '../ui/Input.jsx';
import EmptyState from '../ui/EmptyState.jsx';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ConversationList({ conversations, activeId, onSelect, presence }) {
  const [q, setQ] = useState('');

  const filtered = conversations.filter((c) => c.peer?.fullName?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-display text-lg mb-3">Messages</h2>
        <Input placeholder="Search conversations…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <EmptyState icon="💬" title="No conversations" subtitle="Connect with someone to start chatting." />
        ) : (
          filtered.map((c) => {
            const online = presence[c.peer?.id] ?? c.peer?.isOnline;
            return (
              <motion.button
                key={c.id}
                onClick={() => onSelect(c.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                  activeId === c.id ? 'bg-white/8 border-blush-400' : 'border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <Avatar user={c.peer} online={online} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{c.peer?.fullName}</p>
                    {c.lastMessage && <span className="text-[10px] text-white/30 shrink-0">{timeAgo(c.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white/40 truncate">
                      {c.lastMessage
                        ? c.lastMessage.isDeleted
                          ? 'Message deleted'
                          : c.lastMessage.type === 'IMAGE'
                          ? '📷 Photo'
                          : c.lastMessage.type === 'QUESTION'
                          ? '✨ Surprise question'
                          : c.lastMessage.type === 'MISS_YOU'
                          ? '❤️ Miss you'
                          : c.lastMessage.content
                        : 'Say hello 👋'}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 bg-blush-500 text-white text-[10px] font-medium rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
