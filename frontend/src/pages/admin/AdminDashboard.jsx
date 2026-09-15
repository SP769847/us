import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';

const CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: '🧑‍🤝‍🧑' },
  { key: 'activeUsers', label: 'Active Now', icon: '🟢' },
  { key: 'newUsers', label: 'New This Week', icon: '✨' },
  { key: 'totalConnections', label: 'Connections', icon: '❤️' },
  { key: 'totalMessages', label: 'Messages', icon: '💬' },
  { key: 'pendingReports', label: 'Pending Reports', icon: '🚩' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Admin Overview</h1>
      <p className="text-white/40 text-sm mb-8">Platform health at a glance.</p>

      {!stats ? (
        <SkeletonList count={6} className="h-24" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div key={c.key} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span>{c.icon}</span>
                <span className="text-xs text-white/45">{c.label}</span>
              </div>
              <p className="font-display text-3xl">{stats[c.key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
