import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'danger', label: 'Delete Account' },
];

function Feedback({ text, isError }) {
  if (!text) return null;
  return <p className={`text-xs mt-2 ${isError ? 'text-red-300' : 'text-emerald-300'}`}>{text}</p>;
}

function ProfileSection() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user.fullName, bio: user.bio || '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user.avatarUrl);
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatar(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', isError: false });
    try {
      const data = new FormData();
      data.append('fullName', form.fullName);
      data.append('bio', form.bio);
      if (avatar) data.append('avatar', avatar);
      const { data: res } = await api.patch('/users/me/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(res.user);
      setMsg({ text: 'Profile updated', isError: false });
    } catch (err) {
      setMsg({ text: extractErrorMessage(err), isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar user={{ ...user, avatarUrl: preview }} size="lg" />
        <label className="text-xs text-blush-300 cursor-pointer hover:text-blush-200">
          Change photo
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      </div>
      <Input label="Full Name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
      <Textarea
        label="Bio"
        rows={3}
        maxLength={300}
        value={form.bio}
        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
      />
      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
      <Feedback {...msg} />
    </form>
  );
}

function SecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', isError: false });
    try {
      await api.post('/users/me/change-password', form);
      setMsg({ text: 'Password updated', isError: false });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ text: extractErrorMessage(err), isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm">
      <Input
        label="Current Password"
        type="password"
        value={form.currentPassword}
        onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
        required
      />
      <Input
        label="New Password"
        type="password"
        value={form.newPassword}
        onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
        required
      />
      <Button type="submit" loading={loading}>
        Update Password
      </Button>
      <Feedback {...msg} />
    </form>
  );
}

function PrivacySection() {
  const [blocked, setBlocked] = useState(null);

  const load = () => api.get('/moderation/blocked').then((res) => setBlocked(res.data.blocked));

  useEffect(() => {
    load();
  }, []);

  const unblock = async (username) => {
    await api.post(`/moderation/unblock/${username}`);
    load();
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-white/70 mb-3">Blocked Users</h3>
      {blocked === null ? (
        <p className="text-xs text-white/35">Loading…</p>
      ) : blocked.length === 0 ? (
        <p className="text-xs text-white/35">You haven't blocked anyone.</p>
      ) : (
        <div className="space-y-2">
          {blocked.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
              <span className="text-sm text-white/70">{b.user.fullName}</span>
              <Button size="sm" variant="ghost" onClick={() => unblock(b.user.username)}>
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_LABELS = {
  NEW_MESSAGE: 'New messages',
  CONNECTION_REQUEST: 'Connection requests',
  CONNECTION_ACCEPTED: 'Connection accepted',
  MISS_YOU: 'I Miss You',
  WAITING_FOR_REPLY: 'Waiting-for-reply reminders',
  NEW_LOVE_NOTE: 'Love notes',
  CHALLENGE_RECEIVED: 'Challenges',
  NEW_QUESTION: 'Surprise questions',
};
const IN_APP_TYPES = ['NEW_MESSAGE', 'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'MISS_YOU', 'WAITING_FOR_REPLY', 'NEW_LOVE_NOTE', 'CHALLENGE_RECEIVED', 'NEW_QUESTION'];
const EMAIL_TYPES = ['MISS_YOU', 'WAITING_FOR_REPLY', 'NEW_MESSAGE', 'CONNECTION_REQUEST'];
const WHATSAPP_TYPES = ['MISS_YOU', 'WAITING_FOR_REPLY', 'CONNECTION_REQUEST'];

function PreferenceGroup({ title, types, values, onToggle }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2.5">{title}</h4>
      <div className="space-y-2">
        {types.map((type) => (
          <label key={type} className="flex items-center gap-2.5 text-sm text-white/75 cursor-pointer">
            <input
              type="checkbox"
              checked={values?.[type] ?? false}
              onChange={() => onToggle(type, !values?.[type])}
              className="accent-blush-500"
            />
            {TYPE_LABELS[type] || type}
          </label>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { user, setUser } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [waMsg, setWaMsg] = useState({ text: '', isError: false });
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    api.get('/notifications/preferences').then((res) => setPrefs(res.data.preferences));
  }, []);

  const toggle = async (channel, type, value) => {
    const updated = { ...prefs, [channel]: { ...prefs[channel], [type]: value } };
    setPrefs(updated);
    try {
      await api.patch('/notifications/preferences', { [channel]: { [type]: value } });
    } catch {
      setPrefs(prefs); // revert on failure
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setWaLoading(true);
    setWaMsg({ text: '', isError: false });
    try {
      await api.post('/users/me/whatsapp/send-otp', { phoneNumber: phone });
      setOtpSent(true);
      setWaMsg({ text: 'Verification code sent', isError: false });
    } catch (err) {
      setWaMsg({ text: extractErrorMessage(err), isError: true });
    } finally {
      setWaLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setWaLoading(true);
    setWaMsg({ text: '', isError: false });
    try {
      const { data } = await api.post('/users/me/whatsapp/verify-otp', { code: otp });
      setUser(data.user);
      setOtpSent(false);
      setOtp('');
      setWaMsg({ text: 'WhatsApp number verified', isError: false });
    } catch (err) {
      setWaMsg({ text: extractErrorMessage(err), isError: true });
    } finally {
      setWaLoading(false);
    }
  };

  const disableWhatsapp = async () => {
    setWaLoading(true);
    try {
      const { data } = await api.post('/users/me/whatsapp/disable');
      setUser(data.user);
      setPhone('');
      setWaMsg({ text: 'WhatsApp notifications disabled', isError: false });
    } finally {
      setWaLoading(false);
    }
  };

  if (!prefs) return <p className="text-xs text-white/35">Loading…</p>;

  return (
    <div className="space-y-8">
      <PreferenceGroup title="In-App" types={IN_APP_TYPES} values={prefs.inApp} onToggle={(t, v) => toggle('inApp', t, v)} />
      <PreferenceGroup title="Email" types={EMAIL_TYPES} values={prefs.email} onToggle={(t, v) => toggle('email', t, v)} />
      <PreferenceGroup title="WhatsApp" types={WHATSAPP_TYPES} values={prefs.whatsapp} onToggle={(t, v) => toggle('whatsapp', t, v)} />

      <div className="pt-6 border-t border-white/5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">WhatsApp Number</h4>
        {user.whatsappVerified ? (
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm text-white/80">{user.whatsappNumber}</p>
              <p className="text-xs text-emerald-300 mt-0.5">✓ Verified</p>
            </div>
            <Button size="sm" variant="ghost" onClick={disableWhatsapp} disabled={waLoading}>
              Remove
            </Button>
          </div>
        ) : (
          <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-3 max-w-xs">
            <Input
              label="Phone number"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={otpSent}
              required
            />
            {otpSent && (
              <Input label="Verification code" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            )}
            <Button type="submit" size="sm" loading={waLoading}>
              {otpSent ? 'Verify' : 'Send OTP'}
            </Button>
            {otpSent && (
              <button type="button" onClick={() => setOtpSent(false)} className="ml-2 text-xs text-white/40 hover:text-white/70">
                Change number
              </button>
            )}
            <Feedback {...waMsg} />
          </form>
        )}
      </div>
    </div>
  );
}

function DangerSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [confirming, setConfirming] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/me/delete', { password });
      await logout();
      navigate('/');
    } catch (err) {
      setMsg({ text: extractErrorMessage(err), isError: true });
    }
  };

  return (
    <div className="max-w-sm">
      <p className="text-sm text-white/50 mb-4">
        Deleting your account permanently removes your profile, messages, and connections. This cannot be undone.
      </p>
      {!confirming ? (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Delete My Account
        </Button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Input
            label="Confirm your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" variant="danger">
              Confirm Delete
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
          <Feedback {...msg} />
        </form>
      )}
    </div>
  );
}

export default function Settings() {
  const [section, setSection] = useState('profile');
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-6">Settings</h1>
      <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              section === s.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        {section === 'profile' && <ProfileSection />}
        {section === 'security' && <SecuritySection />}
        {section === 'notifications' && <NotificationsSection />}
        {section === 'privacy' && <PrivacySection />}
        {section === 'danger' && <DangerSection />}
      </div>

      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
