import { useRef, useState } from 'react';
import SurpriseSheet from '../questions/SurpriseSheet.jsx';
import MissYouModal from './MissYouModal.jsx';

const QUICK_EMOJI = ['❤️', '😂', '🥰', '😮', '😢', '👍', '🔥', '✨'];

export default function Composer({ onSend, onTyping, replyTo, onCancelReply, conversationId, peer }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [missYouOpen, setMissYouOpen] = useState(false);
  const fileRef = useRef(null);
  const typingTimeout = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1200);
  };

  const submit = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSend({ content: text.trim(), replyToId: replyTo?.id });
    setText('');
    onTyping?.(false);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSend({ file, replyToId: replyTo?.id });
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-white/5 px-3 sm:px-4 pt-3 sm:pt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
      {replyTo && (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 mb-2 text-xs text-white/50">
          <span className="truncate">Replying to: {replyTo.content?.slice(0, 60) || 'a photo'}</span>
          <button onClick={onCancelReply} className="text-white/40 hover:text-white ml-2">
            &times;
          </button>
        </div>
      )}
      <form onSubmit={submit} className="flex items-end gap-1.5 sm:gap-2 relative">
        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-0 bg-ink-900 border border-white/10 rounded-2xl p-2 flex gap-1 shadow-soft z-10">
            {QUICK_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setText((t) => t + e);
                  setShowEmoji(false);
                }}
                className="text-lg hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {showPlusMenu && (
          <div className="absolute bottom-full mb-2 left-0 bg-ink-900 border border-white/10 rounded-2xl py-1.5 min-w-[150px] shadow-soft z-10">
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                fileRef.current?.click();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/8 transition-colors"
            >
              📎 Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                setShowEmoji(true);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/80 hover:bg-white/8 transition-colors"
            >
              😊 Emoji
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowPlusMenu((v) => !v)}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-colors text-lg"
          aria-label="More options"
        >
          +
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => setSurpriseOpen(true)}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="Surprise question"
          title="Surprise Me"
        >
          ✨
        </button>
        <button
          type="button"
          onClick={() => setMissYouOpen(true)}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="I miss you"
          title="I Miss You"
        >
          🥺
        </button>
        <textarea
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          placeholder="Write something sweet…"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 text-sm resize-none outline-none focus:border-blush-400/50 max-h-32"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blush-500 to-plum-500 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          aria-label="Send"
        >
          ➤
        </button>
      </form>

      <SurpriseSheet open={surpriseOpen} onClose={() => setSurpriseOpen(false)} conversationId={conversationId} />
      <MissYouModal open={missYouOpen} onClose={() => setMissYouOpen(false)} conversationId={conversationId} peerName={peer?.fullName} />
    </div>
  );
}
