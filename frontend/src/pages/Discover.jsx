import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import Avatar from '../components/ui/Avatar.jsx';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';

function ConnectButton({ status, onConnect }) {
  if (status === 'CONNECTED') return <span className="text-xs text-emerald-400 font-medium">Connected</span>;
  if (status === 'PENDING_SENT') return <span className="text-xs text-white/40">Request sent</span>;
  if (status === 'PENDING_RECEIVED') return <span className="text-xs text-blush-300">Respond in Connections</span>;
  return (
    <Button size="sm" onClick={onConnect}>
      Connect
    </Button>
  );
}

export default function Discover() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async (query) => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/discover', { params: query ? { q: query } : {} });
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 350);
    return () => clearTimeout(t);
  }, [q, load]);

  const sendRequest = async (username) => {
    setMessage('');
    try {
      await api.post('/connections/requests', { recipientUsername: username });
      setUsers((prev) => prev.map((u) => (u.username === username ? { ...u, connectionStatus: 'PENDING_SENT' } : u)));
    } catch (err) {
      setMessage(extractErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Discover People</h1>
      <p className="text-white/40 text-sm mb-6">Find someone new to connect with.</p>

      <Input
        placeholder="Search by name or username…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6"
      />
      {message && <p className="text-xs text-red-300 mb-4">{message}</p>}

      {loading ? (
        <SkeletonList count={5} className="h-16" />
      ) : users.length === 0 ? (
        <EmptyState icon="🔎" title="No one found" subtitle="Try a different search, or check back later." />
      ) : (
        <div className="space-y-2.5">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0">
                <Avatar user={u} size="md" online={u.isOnline} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.fullName}</p>
                  <p className="text-xs text-white/40 truncate">@{u.username}</p>
                  {u.bio && <p className="text-xs text-white/35 truncate mt-0.5 max-w-xs">{u.bio}</p>}
                </div>
              </Link>
              <ConnectButton status={u.connectionStatus} onConnect={() => sendRequest(u.username)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
