import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Organizers } from './pages/Organizers';
import { Events } from './pages/Events';
import { Moderation } from './pages/Moderation';
import { Reports } from './pages/Reports';
import { Toaster } from 'react-hot-toast';
import { OrganizerDetail } from './pages/OrganizerDetail';
import { ChatDetail } from './pages/ChatDetail';
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';

const App: React.FC = () => {
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        // e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <HashRouter>
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/organizers" element={<Organizers />} />
                <Route path="/organizers/:id" element={<OrganizerDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/chats" element={<ChatDetail mode="group" />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetail />} />
                <Route path="*" element={<div className="p-10 text-center text-slate-500">Page Under Construction</div>} />
            </Routes>
        </Layout>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#0F2926',
              color: '#fff',
              border: '1px solid #164E46'
            },
          }}
        />
    </HashRouter>
  );
};

export default App;
