import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { extractErrorMessage } from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your private world."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/signup" className="text-blush-300 hover:text-blush-200">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
        <Input label="Email or Username" name="identifier" value={form.identifier} onChange={onChange} required autoFocus />
        <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-white/40 hover:text-white/70">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Log In
        </Button>
      </form>
    </AuthShell>
  );
}
