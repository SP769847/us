import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import ConnectionPicker from '../components/ConnectionPicker.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const GAME_TYPES = [
  { value: 'THIS_OR_THAT', label: 'This or That', icon: '⚖️', desc: 'Quick-fire preferences' },
  { value: 'WOULD_YOU_RATHER', label: 'Would You Rather', icon: '🤔', desc: 'Pick your favourite scenario' },
  { value: 'TRUTH_OR_DARE', label: 'Truth or Dare', icon: '🎭', desc: 'Playful and personal' },
  { value: 'WHO_KNOWS_ME_BETTER', label: 'Who Knows Me Better', icon: '🧠', desc: 'Test how well you know each other' },
];

export default function Games() {
  const connections = useConnections();
  const navigate = useNavigate();
  const [connectionId, setConnectionId] = useState('');
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (connections?.length && !connectionId) setConnectionId(connections[0].id);
  }, [connections, connectionId]);

  useEffect(() => {
    if (connectionId) api.get('/games', { params: { connectionId } }).then((res) => setSessions(res.data.sessions));
  }, [connectionId]);

  const start = async (gameType) => {
    setError('');
    try {
      const { data } = await api.post('/games', { connectionId, gameType });
      navigate(`/games/${data.session.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (connections && connections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <EmptyState icon="🎲" title="Connect with someone first" subtitle="Games are played with a connection." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Games 🎲</h1>
      <p className="text-white/40 text-sm mb-6">Playful ways to connect, built for two.</p>

      <div className="mb-6 max-w-xs">
        <ConnectionPicker connections={connections} value={connectionId} onChange={setConnectionId} label="Playing with" />
      </div>

      {error && <p className="text-xs text-red-300 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {GAME_TYPES.map((g) => (
          <button
            key={g.value}
            onClick={() => start(g.value)}
            disabled={!connectionId}
            className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          >
            <div className="text-2xl mb-2">{g.icon}</div>
            <h3 className="font-medium text-sm mb-1">{g.label}</h3>
            <p className="text-xs text-white/40">{g.desc}</p>
          </button>
        ))}
      </div>

      <h3 className="text-sm font-medium text-white/70 mb-3">Recent Rounds</h3>
      {sessions === null ? null : sessions.length === 0 ? (
        <EmptyState icon="🎲" title="No games played yet" />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/games/${s.id}`)}
              className="w-full flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 hover:bg-white/8 transition-colors text-left"
            >
              <span className="text-sm">{GAME_TYPES.find((g) => g.value === s.gameType)?.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/50'}`}>
                {s.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
