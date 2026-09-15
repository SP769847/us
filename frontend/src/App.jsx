import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, AdminRoute } from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ToastHost from './components/ToastHost.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import Connections from './pages/Connections.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Chat from './pages/Chat.jsx';
import LoveNotes from './pages/LoveNotes.jsx';
import ReadThisWhen from './pages/ReadThisWhen.jsx';
import SecretMessages from './pages/SecretMessages.jsx';
import DailyQuestion from './pages/DailyQuestion.jsx';
import Challenges from './pages/Challenges.jsx';
import Games from './pages/Games.jsx';
import GameSession from './pages/GameSession.jsx';
import Memories from './pages/Memories.jsx';
import Timeline from './pages/Timeline.jsx';
import SpecialDates from './pages/SpecialDates.jsx';
import Notifications from './pages/Notifications.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/u/:username" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/love-notes" element={<LoveNotes />} />
            <Route path="/read-this-when" element={<ReadThisWhen />} />
            <Route path="/secret-messages" element={<SecretMessages />} />
            <Route path="/daily-question" element={<DailyQuestion />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:id" element={<GameSession />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/special-dates" element={<SpecialDates />} />
            <Route path="/notifications" element={<Notifications />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
