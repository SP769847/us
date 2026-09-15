import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');

  const load = (query) => api.get('/admin/users', { params: query ? { q: query } : {} }).then((res) => setUsers(res.data.users));

  useEffect(() => {
    load('');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const toggleSuspend = async (u) => {
    const endpoint = u.status === 'SUSPENDED' ? 'unsuspend' : 'suspend';
    await api.post(`/admin/users/${u.id}/${endpoint}`);
    load(q);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Users</h1>
      <p className="text-white/40 text-sm mb-6">Manage accounts on the platform.</p>

      <Input placeholder="Search by name, username, or email…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 max-w-sm" />

      <div className="overflow-x-auto glass rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40 border-b border-white/5">
              <th className="p-4 font-normal">User</th>
              <th className="p-4 font-normal">Email</th>
              <th className="p-4 font-normal">Role</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Joined</th>
              <th className="p-4 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar user={u} size="sm" />
                    <div>
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-white/35">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-white/60">{u.email}</td>
                <td className="p-4 text-white/60">{u.role}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-white/40 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  {u.role !== 'ADMIN' && (
                    <Button size="sm" variant={u.status === 'SUSPENDED' ? 'secondary' : 'danger'} onClick={() => toggleSuspend(u)}>
                      {u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
