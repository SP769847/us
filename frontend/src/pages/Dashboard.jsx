import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

function Card({ to, icon, title, children, className = '' }) {
  return (
    <motion.div whileHover={{ y: -3 }} className={className}>
      <Link to={to} className="glass rounded-2xl p-5 h-full flex flex-col hover:bg-white/[0.06] transition-colors block">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-medium text-white/80">{title}</h3>
        </div>
        <div className="flex-1">{children}</div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl sm:text-3xl mb-1"
      >
        Welcome back, {user.fullName.split(' ')[0]} ❤️
      </motion.h1>
      <p className="text-white/40 text-sm mb-8">Here's what's happening in your world.</p>

      {!data ? (
        <SkeletonList count={6} className="h-32" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card to="/chat" icon="💬" title="Recent Conversations">
            {data.recentConversations.length === 0 ? (
              <p className="text-xs text-white/35">No conversations yet</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentConversations.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <Avatar user={c.peer} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 truncate">{c.peer?.fullName}</p>
                      <p className="text-[11px] text-white/35 truncate">{c.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card to="/connections" icon="❤️" title="Connections">
            <p className="text-2xl font-display">{data.connectionsCount}</p>
            <p className="text-xs text-white/35 mt-1">
              {data.onlineConnections.length > 0
                ? `${data.onlineConnections.length} online now`
                : 'No one online right now'}
            </p>
          </Card>

          <Card to="/love-notes" icon="💌" title="New Love Notes">
            <p className="text-2xl font-display">{data.newLoveNotesCount}</p>
            <p className="text-xs text-white/35 mt-1">in the last 7 days</p>
          </Card>

          <Card to="/secret-messages" icon="🔐" title="Locked Messages">
            <p className="text-2xl font-display">{data.lockedMessagesCount}</p>
            <p className="text-xs text-white/35 mt-1">waiting to be opened</p>
          </Card>

          <Card to="/games" icon="🎲" title="Today's Game">
            <p className="text-xs text-white/50">Start a round of This or That, Would You Rather, or Truth or Dare.</p>
          </Card>

          <Card to="/memories" icon="📸" title="Recent Memories">
            {data.recentMemories.length === 0 ? (
              <p className="text-xs text-white/35">No memories saved yet</p>
            ) : (
              <div className="space-y-1.5">
                {data.recentMemories.slice(0, 3).map((m) => (
                  <p key={m.id} className="text-xs text-white/60 truncate">
                    • {m.title}
                  </p>
                ))}
              </div>
            )}
          </Card>

          <Card to="/special-dates" icon="⏳" title="Upcoming Special Dates" className="sm:col-span-2 lg:col-span-1">
            {data.upcomingSpecialDates.length === 0 ? (
              <p className="text-xs text-white/35">No upcoming dates</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingSpecialDates.map((sd) => (
                  <div key={sd.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{sd.title}</span>
                    <span className="text-blush-300 font-medium">{sd.daysUntil}d</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {data.onlineConnections.length > 0 && (
            <div className="glass rounded-2xl p-5 sm:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium text-white/80 mb-3">Online now</h3>
              <div className="flex flex-wrap gap-3">
                {data.onlineConnections.map((u) => (
                  <Link key={u.id} to={`/u/${u.username}`} className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1">
                    <Avatar user={u} size="xs" online />
                    <span className="text-xs text-white/70">{u.fullName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data && data.connectionsCount === 0 && (
        <EmptyState
          icon="💫"
          title="Your world is waiting"
          subtitle="Find someone to connect with and start building your private space together."
          action={
            <Link to="/discover" className="text-sm text-blush-300 hover:text-blush-200">
              Discover people →
            </Link>
          }
        />
      )}
    </div>
  );
}
