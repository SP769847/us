import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import api, { extractErrorMessage } from '../services/api.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, ...form });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password reset link is missing its token.">
        <Link to="/forgot-password" className="text-blush-300 hover:text-blush-200 text-sm">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose something you'll remember.">
      {success ? (
        <p className="text-sm text-emerald-300">Password updated! Redirecting you to login…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
          <Input label="New Password" name="password" type="password" value={form.password} onChange={onChange} required autoFocus />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Reset Password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
