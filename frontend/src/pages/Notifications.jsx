import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const ICONS = {
  CONNECTION_REQUEST: '❤️',
  CONNECTION_ACCEPTED: '🎉',
  NEW_MESSAGE: '💬',
  NEW_LOVE_NOTE: '💌',
  READ_THIS_WHEN: '💕',
  NEW_SECRET_MESSAGE: '🔐',
  CHALLENGE_RECEIVED: '🔥',
  GAME_INVITE: '🎲',
  DAILY_ANSWER_SHARED: '🥰',
  NEW_QUESTION: '✨',
  QUESTION_ANSWERED: '💕',
  MISS_YOU: '❤️',
  WAITING_FOR_REPLY: '💌',
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const open = (n) => {
    if (!n.isRead) markRead(n.id);
    if (n.conversationId) navigate(`/chat/${n.conversationId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={`w-full text-left flex items-start gap-3 rounded-xl p-4 transition-colors ${
                n.isRead ? 'bg-white/[0.02]' : 'bg-white/6'
              } hover:bg-white/8`}
            >
              <span className="text-lg">{ICONS[n.type] || '✨'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/85">{n.title}</p>
                {n.body && <p className="text-xs text-white/40 mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-white/25 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-blush-500 mt-1.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
