import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getSocket } from '../services/socket.js';
import ConversationList from '../components/chat/ConversationList.jsx';
import MessageBubble from '../components/chat/MessageBubble.jsx';
import Composer from '../components/chat/Composer.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Chat() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [presence, setPresence] = useState({});
  const [typingPeer, setTypingPeer] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [pinned, setPinned] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const loadingOlder = useRef(false);

  const loadConversations = useCallback(async () => {
    const { data } = await api.get('/conversations');
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setPeer(null);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);
    setReplyTo(null);

    (async () => {
      try {
        const [{ data: convo }, { data: msgs }] = await Promise.all([
          api.get(`/conversations/${conversationId}`),
          api.get(`/conversations/${conversationId}/messages`),
        ]);
        if (cancelled) return;
        setPeer(convo.conversation.peer);
        setMessages(msgs.messages);
        setNextCursor(msgs.nextCursor);
        await api.post(`/conversations/${conversationId}/read`);
        loadConversations();
        getSocket()?.emit('join-conversation', { conversationId });
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      } catch (err) {
        setError(extractErrorMessage(err, 'Could not load this conversation'));
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, loadConversations]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
        api.post(`/conversations/${conversationId}/read`).catch(() => {});
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      loadConversations();
    };
    const onDeleted = ({ id, conversationId: cid }) => {
      if (cid === conversationId) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isDeleted: true, content: null, attachmentUrl: null } : m)));
      }
    };
    const onReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };
    const onPinChanged = ({ messageId, pinned: isPinned }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m)));
    };
    const onQuestionAnswered = ({ messageId, sentQuestion }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, sentQuestion } : m)));
    };
    const onQuestionRevealed = ({ messageId, sentQuestion }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, sentQuestion } : m)));
    };
    const onQuestionSkipped = ({ messageId, sentQuestion }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, sentQuestion } : m)));
    };
    const onTypingStart = ({ conversationId: cid }) => {
      if (cid === conversationId) setTypingPeer(true);
    };
    const onTypingStop = ({ conversationId: cid }) => {
      if (cid === conversationId) setTypingPeer(false);
    };
    const onOnline = ({ userId }) => setPresence((p) => ({ ...p, [userId]: true }));
    const onOffline = ({ userId }) => setPresence((p) => ({ ...p, [userId]: false }));

    socket.on('new-message', onNewMessage);
    socket.on('message-deleted', onDeleted);
    socket.on('message-reaction', onReaction);
    socket.on('message-pin-changed', onPinChanged);
    socket.on('question-answered', onQuestionAnswered);
    socket.on('question-revealed', onQuestionRevealed);
    socket.on('question-skipped', onQuestionSkipped);
    socket.on('typing-start', onTypingStart);
    socket.on('typing-stop', onTypingStop);
    socket.on('user-online', onOnline);
    socket.on('user-offline', onOffline);

    return () => {
      socket.off('new-message', onNewMessage);
      socket.off('message-deleted', onDeleted);
      socket.off('message-reaction', onReaction);
      socket.off('message-pin-changed', onPinChanged);
      socket.off('question-answered', onQuestionAnswered);
      socket.off('question-revealed', onQuestionRevealed);
      socket.off('question-skipped', onQuestionSkipped);
      socket.off('typing-start', onTypingStart);
      socket.off('typing-stop', onTypingStop);
      socket.off('user-online', onOnline);
      socket.off('user-offline', onOffline);
    };
  }, [conversationId, loadConversations]);

  const loadOlder = async () => {
    if (!nextCursor || loadingOlder.current) return;
    loadingOlder.current = true;
    prevScrollHeight.current = scrollRef.current?.scrollHeight || 0;
    const { data } = await api.get(`/conversations/${conversationId}/messages`, { params: { before: nextCursor } });
    setMessages((prev) => [...data.messages, ...prev]);
    setNextCursor(data.nextCursor);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight.current;
      }
      loadingOlder.current = false;
    });
  };

  const onScroll = (e) => {
    if (e.target.scrollTop < 80) loadOlder();
  };

  const send = async ({ content, file, replyToId }) => {
    setReplyTo(null);
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (file) formData.append('image', file);
    if (replyToId) formData.append('replyToId', replyToId);
    await api.post(`/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const onTyping = (isTyping) => {
    getSocket()?.emit(isTyping ? 'typing-start' : 'typing-stop', { conversationId });
  };

  const reactToMessage = async (messageId, emoji) => {
    await api.post(`/messages/${messageId}/reactions`, { emoji });
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    await api.delete(`/messages/${messageId}`);
  };

  const togglePin = async (messageId) => {
    await api.post(`/messages/${messageId}/pin`);
  };

  const answerQuestion = async (sentQuestionId, answer) => {
    await api.post(`/questions/${sentQuestionId}/answer`, { answer });
  };

  const revealQuestion = async (sentQuestionId) => {
    await api.post(`/questions/${sentQuestionId}/reveal`);
  };

  const skipQuestion = async (sentQuestionId) => {
    await api.post(`/questions/${sentQuestionId}/skip`);
  };

  const openPinned = async () => {
    const { data } = await api.get(`/conversations/${conversationId}/pinned`);
    setPinned(data.pinned);
    setPinnedOpen(true);
  };

  const runSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setSearchResults([]);
    const { data } = await api.get(`/conversations/${conversationId}/search`, { params: { q } });
    setSearchResults(data.messages);
  };

  if (conversations === null) return <FullPageLoader />;

  const showList = !conversationId;

  return (
    <div className="h-full flex overflow-hidden">
      <div className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-white/5 shrink-0`}>
        <ConversationList
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => navigate(`/chat/${id}`)}
          presence={presence}
        />
      </div>

      <div className={`${showList ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0 min-h-0`}>
        {!conversationId ? (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <EmptyState icon="💬" title="Select a conversation" subtitle="Choose someone from the list to start chatting." />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="🚫" title="Unable to open this chat" subtitle={error} />
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => navigate('/chat')} className="md:hidden text-white/60 mr-1">
                  ←
                </button>
                {peer && (
                  <>
                    <Avatar user={peer} online={presence[peer.id] ?? peer.isOnline} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{peer.fullName}</p>
                      <p className="text-xs text-white/35">
                        {typingPeer ? <span className="text-blush-300">typing…</span> : (presence[peer.id] ?? peer.isOnline) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5" aria-label="Search messages">
                  🔎
                </button>
                <button onClick={openPinned} className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5" aria-label="Pinned messages">
                  📌
                </button>
              </div>
            </div>

            <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 rounded-full border-2 border-blush-300/30 border-t-blush-400 animate-spin" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <MessageBubble
                        message={m}
                        isMine={m.senderId === user.id}
                        myId={user.id}
                        peer={peer}
                        onReact={reactToMessage}
                        onDelete={deleteMessage}
                        onPin={togglePin}
                        onReply={setReplyTo}
                        onAnswerQuestion={answerQuestion}
                        onRevealQuestion={revealQuestion}
                        onSkipQuestion={skipQuestion}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            <Composer onSend={send} onTyping={onTyping} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} conversationId={conversationId} />
          </>
        )}
      </div>

      <Modal open={pinnedOpen} onClose={() => setPinnedOpen(false)} title="📌 Pinned Messages">
        {pinned.length === 0 ? (
          <p className="text-sm text-white/40">No pinned messages yet.</p>
        ) : (
          <div className="space-y-3">
            {pinned.map((p) => (
              <div key={p.pinId} className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">{p.message.sender.fullName}</p>
                <p className="text-sm text-white/80">
                  {p.message.type === 'IMAGE' ? '📷 Photo' : p.message.type === 'QUESTION' ? '✨ A surprise question' : p.message.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search this conversation">
        <Input placeholder="Search messages…" value={searchQuery} onChange={(e) => runSearch(e.target.value)} autoFocus />
        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {searchResults.map((m) => (
            <div key={m.id} className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-white/40 mb-1">
                {m.sender.fullName} · {new Date(m.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-white/80">{m.content}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
