import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { extractErrorMessage } from '../services/api.js';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (avatar) data.append('avatar', avatar);
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create your account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your world"
      subtitle="A private space for you and the people who matter."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-blush-300 hover:text-blush-200">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
        <Input label="Full Name" name="fullName" value={form.fullName} onChange={onChange} required autoFocus />
        <Input
          label="Username"
          name="username"
          value={form.username}
          onChange={onChange}
          placeholder="letters, numbers, underscore"
          required
        />
        <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={onChange}
          required
        />
        <label className="block">
          <span className="block text-xs font-medium text-white/50 mb-1.5">Profile Photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
            className="block w-full text-xs text-white/50 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/8 file:text-white/70 file:text-xs hover:file:bg-white/14"
          />
        </label>
        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
