import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api.js';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';

const TABS = [
  { id: 'connections', label: 'Connections' },
  { id: 'received', label: 'Requests' },
  { id: 'sent', label: 'Sent' },
];

export default function Connections() {
  const [tab, setTab] = useState('connections');
  const [connections, setConnections] = useState(null);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: c }, { data: r }] = await Promise.all([api.get('/connections'), api.get('/connections/requests')]);
    setConnections(c.connections);
    setRequests(r);
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id, action) => {
    setError('');
    try {
      await api.post(`/connections/requests/${id}/respond`, { action });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const cancel = async (id) => {
    await api.delete(`/connections/requests/${id}`);
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-6">Connections</h1>

      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors relative ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {t.label}
            {t.id === 'received' && requests.received.length > 0 && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blush-500 align-middle" />
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-300 mb-4">{error}</p>}

      {connections === null ? (
        <SkeletonList count={3} className="h-16" />
      ) : (
        <>
          {tab === 'connections' &&
            (connections.length === 0 ? (
              <EmptyState icon="❤️" title="No connections yet" subtitle="Head to Discover to find someone." />
            ) : (
              <div className="space-y-2.5">
                {connections.map((c) => (
                  <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <Link to={`/u/${c.user.username}`} className="flex items-center gap-3">
                      <Avatar user={c.user} online={c.user.isOnline} />
                      <div>
                        <p className="text-sm font-medium">{c.user.fullName}</p>
                        <p className="text-xs text-white/40">@{c.user.username}</p>
                      </div>
                    </Link>
                    <Link to={`/chat/${c.conversationId}`}>
                      <Button size="sm" variant="secondary">
                        Message
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ))}

          {tab === 'received' &&
            (requests.received.length === 0 ? (
              <EmptyState icon="📬" title="No pending requests" />
            ) : (
              <div className="space-y-2.5">
                {requests.received.map((r) => (
                  <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={r.sender} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{r.sender.fullName}</p>
                        {r.message && <p className="text-xs text-white/40 truncate max-w-[220px]">"{r.message}"</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => respond(r.id, 'decline')}>
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => respond(r.id, 'accept')}>
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {tab === 'sent' &&
            (requests.sent.length === 0 ? (
              <EmptyState icon="📤" title="No sent requests" />
            ) : (
              <div className="space-y-2.5">
                {requests.sent.map((r) => (
                  <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar user={r.recipient} />
                      <p className="text-sm font-medium">{r.recipient.fullName}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
