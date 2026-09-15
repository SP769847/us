import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import api, { extractErrorMessage } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.devResetLink) setDevLink(data.devResetLink);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll help you get back in."
      footer={
        <Link to="/login" className="text-blush-300 hover:text-blush-200">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="text-sm text-white/70 space-y-3">
          <p>If an account exists for that email, a reset link has been generated.</p>
          {devLink && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs break-all">
              <p className="text-white/40 mb-1">Dev mode — no email service configured, use this link:</p>
              <Link to={devLink.replace(window.location.origin, '')} className="text-blush-300 underline">
                {devLink}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" className="w-full" loading={loading}>
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
