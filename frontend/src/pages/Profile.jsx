import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'FAKE_ACCOUNT', label: 'Fake account' },
  { value: 'OTHER', label: 'Other' },
];

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
    } catch (err) {
      setError(extractErrorMessage(err, 'User not found'));
    }
  };

  useEffect(() => {
    setProfile(null);
    load();
  }, [username]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-white/50">{error}</p>
      </div>
    );
  }
  if (!profile) return <FullPageLoader />;

  const isSelf = profile.connectionStatus === 'SELF';

  const connect = async () => {
    await api.post('/connections/requests', { recipientUsername: username });
    setProfile((p) => ({ ...p, connectionStatus: 'PENDING_SENT' }));
  };

  const block = async () => {
    if (!confirm(`Block @${profile.username}? They won't be able to message or find you.`)) return;
    await api.post('/moderation/block', { username });
    navigate('/discover');
  };

  const submitReport = async () => {
    await api.post('/moderation/reports', { username, reason: reportReason, details: reportDetails });
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
      setReportDetails('');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="glass rounded-3xl p-8 text-center">
        <Avatar user={profile} size="xl" online={profile.isOnline} className="mx-auto mb-4" />
        <h1 className="font-display text-2xl">{profile.fullName}</h1>
        <p className="text-white/40 text-sm mb-1">@{profile.username}</p>
        <p className="text-xs text-white/30 mb-4">
          {profile.isOnline ? 'Online now' : `Joined ${new Date(profile.createdAt).toLocaleDateString()}`}
        </p>
        {profile.bio && <p className="text-sm text-white/60 max-w-md mx-auto mb-6">{profile.bio}</p>}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {isSelf ? (
            <Link to="/settings">
              <Button variant="secondary">Edit Profile</Button>
            </Link>
          ) : (
            <>
              {profile.connectionStatus === 'NONE' && <Button onClick={connect}>Connect</Button>}
              {profile.connectionStatus === 'PENDING_SENT' && (
                <Button variant="secondary" disabled>
                  Request Sent
                </Button>
              )}
              {profile.connectionStatus === 'PENDING_RECEIVED' && (
                <Link to="/connections">
                  <Button variant="secondary">Respond to Request</Button>
                </Link>
              )}
              {profile.connectionStatus === 'CONNECTED' && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const { data } = await api.get('/connections');
                    const c = data.connections.find((c) => c.user.username === username);
                    if (c) navigate(`/chat/${c.conversationId}`);
                  }}
                >
                  Message
                </Button>
              )}
              <Button variant="ghost" onClick={block}>
                Block
              </Button>
              <Button variant="ghost" onClick={() => setReportOpen(true)}>
                Report
              </Button>
            </>
          )}
        </div>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={`Report @${profile.username}`}>
        {reportSent ? (
          <p className="text-sm text-emerald-300">Report submitted. Our team will review it.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    reportReason === r.value
                      ? 'bg-blush-500/20 border-blush-400/40 text-blush-200'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Textarea
              label="Additional details (optional)"
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
            <Button className="w-full" onClick={submitReport}>
              Submit Report
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
