import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const TABS = ['PENDING', 'RESOLVED', 'DISMISSED'];

export default function AdminReports() {
  const [tab, setTab] = useState('PENDING');
  const [reports, setReports] = useState(null);

  const load = () => api.get('/admin/reports', { params: { status: tab } }).then((res) => setReports(res.data.reports));

  useEffect(() => {
    load();
  }, [tab]);

  const resolve = async (id, status) => {
    await api.post(`/admin/reports/${id}/resolve`, { status });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-6">Reports</h1>

      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'}`}
          >
            {t[0] + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {reports === null ? null : reports.length === 0 ? (
        <EmptyState icon="🚩" title="Nothing here" />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  {r.reporter.fullName} reported {r.reported.fullName}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50">{r.reason}</span>
              </div>
              {r.details && <p className="text-xs text-white/50 mb-3">"{r.details}"</p>}
              <p className="text-[11px] text-white/30 mb-3">{new Date(r.createdAt).toLocaleString()}</p>
              {tab === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve(r.id, 'RESOLVED')}>
                    Mark Resolved
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve(r.id, 'DISMISSED')}>
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
