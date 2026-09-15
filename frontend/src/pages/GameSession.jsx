import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';

export default function GameSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [freeText, setFreeText] = useState('');
  const pollRef = useRef(null);

  const load = () => api.get(`/games/${id}`).then((res) => setSession(res.data.session));

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, [id]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (session && session.myAnswer !== null && !session.revealed) {
      pollRef.current = setInterval(load, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [session]);

  const answer = async (value) => {
    await api.post(`/games/${id}/answer`, { answer: value });
    load();
  };

  if (!session) return <FullPageLoader />;

  const isChoiceGame = session.gameType === 'THIS_OR_THAT' || session.gameType === 'WOULD_YOU_RATHER';
  const isTruthOrDare = session.gameType === 'TRUTH_OR_DARE';
  const isWhoKnows = session.gameType === 'WHO_KNOWS_ME_BETTER';

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate('/games')} className="text-white/40 hover:text-white text-sm mb-6">
        ← Back to games
      </button>

      <div className="glass rounded-3xl p-8 text-center">
        {isChoiceGame && (
          <>
            <p className="text-xs uppercase tracking-wider text-blush-300/70 mb-4">
              {session.gameType === 'THIS_OR_THAT' ? 'This or That' : 'Would You Rather'}
            </p>
            {session.myAnswer === null ? (
              <div className="grid grid-cols-2 gap-3">
                {['a', 'b'].map((key) => (
                  <button
                    key={key}
                    onClick={() => answer(key)}
                    className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors font-display text-lg"
                  >
                    {session.prompt[key]}
                  </button>
                ))}
              </div>
            ) : (
              <WaitingOrReveal session={session} render={(other) => (
                <div className="space-y-2">
                  <p className="text-sm text-white/50">You chose</p>
                  <p className="font-display text-xl text-blush-300">{session.prompt[session.myAnswer]}</p>
                  {other && (
                    <>
                      <p className="text-sm text-white/50 mt-4">They chose</p>
                      <p className="font-display text-xl text-plum-300">{session.prompt[other]}</p>
                    </>
                  )}
                </div>
              )} />
            )}
          </>
        )}

        {isTruthOrDare && (
          <>
            <p className="text-xs uppercase tracking-wider text-blush-300/70 mb-2">{session.prompt.type}</p>
            <h2 className="font-display text-lg mb-5">{session.prompt.prompt}</h2>
            {session.myAnswer === null ? (
              <div className="space-y-3">
                <Textarea rows={3} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Your response…" />
                <Button className="w-full" onClick={() => answer(freeText)} disabled={!freeText.trim()}>
                  Submit
                </Button>
              </div>
            ) : (
              <WaitingOrReveal session={session} render={(other) => (
                <div className="space-y-3 text-left">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-1">Your response</p>
                    <p className="text-sm text-white/80">{session.myAnswer}</p>
                  </div>
                  {other && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-white/40 mb-1">Their response</p>
                      <p className="text-sm text-white/80">{other}</p>
                    </div>
                  )}
                </div>
              )} />
            )}
          </>
        )}

        {isWhoKnows && (
          <>
            <p className="text-xs uppercase tracking-wider text-blush-300/70 mb-2">Who Knows Me Better</p>
            <h2 className="font-display text-lg mb-5">{session.question}</h2>
            <p className="text-xs text-white/40 mb-4">
              {session.subjectId ? 'One of you answers honestly, the other guesses.' : ''}
            </p>
            {session.myAnswer === null ? (
              <div className="space-y-3">
                <Textarea rows={2} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Your answer or guess…" />
                <Button className="w-full" onClick={() => answer(freeText)} disabled={!freeText.trim()}>
                  Submit
                </Button>
              </div>
            ) : (
              <WaitingOrReveal session={session} render={(other) => (
                <div className="space-y-3 text-left">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-1">You said</p>
                    <p className="text-sm text-white/80">{session.myAnswer}</p>
                  </div>
                  {other && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-white/40 mb-1">They said</p>
                      <p className="text-sm text-white/80">{other}</p>
                    </div>
                  )}
                </div>
              )} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WaitingOrReveal({ session, render }) {
  const other = session.revealed
    ? Object.values(session.answers || {}).find((v) => v !== session.myAnswer) ?? Object.values(session.answers || {})[0]
    : null;

  return (
    <AnimatePresence mode="wait">
      {session.revealed ? (
        <motion.div key="reveal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {render(other)}
        </motion.div>
      ) : (
        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
          <div className="w-6 h-6 mx-auto mb-3 rounded-full border-2 border-blush-300/30 border-t-blush-400 animate-spin" />
          <p className="text-sm text-white/40">Waiting for the other player to answer…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
