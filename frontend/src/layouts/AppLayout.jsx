import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotifications } from '../contexts/NotificationContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import SurpriseMeButton from '../components/SurpriseMeButton.jsx';

const NAV_PRIMARY = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/discover', label: 'Discover', icon: '🔎' },
  { to: '/connections', label: 'Connections', icon: '❤️' },
  { to: '/chat', label: 'Messages', icon: '💬' },
];

const NAV_TOGETHER = [
  { to: '/love-notes', label: 'Love Notes', icon: '💌' },
  { to: '/read-this-when', label: 'Read This When', icon: '📖' },
  { to: '/secret-messages', label: 'Secret Messages', icon: '🔐' },
  { to: '/daily-question', label: 'Daily Question', icon: '🥰' },
  { to: '/questions', label: 'Surprise Questions', icon: '✨' },
  { to: '/challenges', label: 'Challenges', icon: '🔥' },
  { to: '/games', label: 'Games', icon: '🎲' },
  { to: '/memories', label: 'Memories', icon: '📸' },
  { to: '/timeline', label: 'Our Timeline', icon: '⏳' },
  { to: '/special-dates', label: 'Special Dates', icon: '📅' },
];

function NavItem({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/85 hover:bg-white/5'
        }`
      }
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-4">
        <span className="font-display text-xl text-gradient font-semibold">Us</span>
      </div>
      <div className="px-2 space-y-1">
        {NAV_PRIMARY.map((item) => (
          <NavItem key={item.to} {...item} onClick={onNavigate} />
        ))}
      </div>
      <div className="mt-6 px-4 text-[10px] uppercase tracking-wider text-white/30 font-medium">Together</div>
      <div className="px-2 mt-2 space-y-1 flex-1 overflow-y-auto scrollbar-none pb-4">
        {NAV_TOGETHER.map((item) => (
          <NavItem key={item.to} {...item} onClick={onNavigate} />
        ))}
        {user?.role === 'ADMIN' && (
          <>
            <div className="mt-6 mb-2 px-2 text-[10px] uppercase tracking-wider text-white/30 font-medium">Admin</div>
            <NavItem to="/admin" label="Overview" icon="📊" onClick={onNavigate} />
            <NavItem to="/admin/users" label="Users" icon="🧑‍🤝‍🧑" onClick={onNavigate} />
            <NavItem to="/admin/reports" label="Reports" icon="🚩" onClick={onNavigate} />
            <NavItem to="/admin/questions" label="Question Bank" icon="❓" onClick={onNavigate} />
          </>
        )}
      </div>
      <div className="px-2 pb-4 border-t border-white/5 pt-3">
        <NavItem to="/settings" label="Settings" icon="⚙️" onClick={onNavigate} />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');
  // On mobile, an open conversation shows its own header (with a back
  // button) inside Chat.jsx, so the app header can step aside. The bare
  // conversation list has no such header of its own, so it must keep this
  // one for the hamburger menu / notifications / avatar to stay reachable.
  const isActiveConversation = /^\/chat\/[^/]+/.test(location.pathname);

  return (
    <div className="app-shell bg-ink-950 bg-romantic-radial flex">
      <aside className="hidden md:flex md:w-64 border-r border-white/5 flex-col shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-ink-900 border-r border-white/5 md:hidden"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 ${isActiveConversation ? 'hidden md:flex' : 'flex'}`}>
          <button className="md:hidden text-white/70 text-xl" onClick={() => setMobileOpen(true)}>
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 md:gap-3">
            <SurpriseMeButton />
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blush-500" />
              )}
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
                <Avatar user={user} size="sm" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-xl p-1.5 shadow-soft z-20"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(`/u/${user.username}`);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-white/70 hover:bg-white/8 hover:text-white"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-white/70 hover:bg-white/8 hover:text-white"
                    >
                      Settings
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-300/80 hover:bg-red-500/10 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className={`flex-1 min-h-0 ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
