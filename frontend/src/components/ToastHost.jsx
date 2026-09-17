import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotifications } from '../contexts/NotificationContext.jsx';

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

export default function ToastHost() {
  const { user } = useAuth();
  const { toast, dismissToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 5000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!user) return null;

  const openToast = () => {
    if (toast?.conversationId) navigate(`/chat/${toast.conversationId}`);
    dismissToast();
  };

  return (
    <div className="fixed top-4 right-4 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onClick={openToast}
            className="glass rounded-2xl p-4 shadow-soft cursor-pointer flex items-start gap-3"
          >
            <span className="text-xl leading-none">{ICONS[toast.type] || '✨'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{toast.title}</p>
              {toast.body && <p className="text-xs text-white/50 truncate mt-0.5">{toast.body}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
