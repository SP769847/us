import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '💬', title: 'Private Conversations', desc: 'Real-time, permanently saved messages only between people who choose to connect.' },
  { icon: '🪪', title: 'Personal Profiles', desc: 'A calm, honest space to introduce yourself — no feeds, no follower counts.' },
  { icon: '💌', title: 'Love Notes', desc: 'Write something for someone that lives in their world whenever they need it.' },
  { icon: '🔐', title: 'Secret Messages', desc: 'Locked words that unlock on a date, or with a passcode only they know.' },
  { icon: '📸', title: 'Memories & Timeline', desc: 'Keep the moments that mattered, in order, with photos and a little context.' },
  { icon: '🎲', title: 'Games & Challenges', desc: 'Playful prompts and games built for two — nothing explicit, just fun.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 bg-romantic-radial text-white overflow-x-hidden">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold text-gradient">Us</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2">
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 px-4 py-2 rounded-xl shadow-glow hover:brightness-110 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-24">
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-blush-300/80 mb-5">
            A quieter kind of social
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-tight mb-6">
            Your Private <span className="text-gradient">Little World.</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto mb-10">
            A place to connect, talk, laugh, share memories and keep the moments that matter.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="font-medium bg-gradient-to-r from-blush-500 to-plum-500 px-6 py-3 rounded-2xl shadow-glow hover:brightness-110 transition-all"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="font-medium bg-white/8 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/14 transition-all"
            >
              Login
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 glass rounded-3xl p-6 sm:p-10 shadow-soft mx-auto max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blush-400 to-plum-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Sam</p>
              <p className="text-xs text-emerald-400/80">online</p>
            </div>
          </div>
          <div className="space-y-3 text-left">
            <div className="bg-white/6 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[70%]">
              Hey — I wrote you a little note today 💌
            </div>
            <div className="bg-gradient-to-r from-blush-500/80 to-plum-500/80 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[70%] ml-auto">
              I saw the lock icon and got so curious 🔐
            </div>
            <div className="bg-white/6 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[70%]">
              It unlocks tonight at 9 ✨
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl sm:text-3xl text-center mb-12"
        >
          Everything you need, nothing you don't
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-medium mb-1.5">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 sm:p-12 text-center"
        >
          <div className="text-3xl mb-4">🔒</div>
          <h2 className="font-display text-2xl sm:text-3xl mb-4">Built to be private, by default</h2>
          <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
            You can only message people who accept your connection request. Conversations, love notes, and secret
            messages are never visible to anyone outside that connection — not even in the URL. Block or report
            anyone, anytime.
          </p>
        </motion.div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl sm:text-4xl mb-6">Create Your Private World ❤️</h2>
          <Link
            to="/signup"
            className="inline-block font-medium bg-gradient-to-r from-blush-500 to-plum-500 px-8 py-3.5 rounded-2xl shadow-glow hover:brightness-110 transition-all"
          >
            Get Started — it's free
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        Made for the people who matter most.
      </footer>
    </div>
  );
}
