import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CreateEvent from './pages/CreateEvent';
import Moderation from './pages/Moderation';
import ChatDetail from './pages/ChatDetail';
import { EventProvider } from './context/EventContext';

const App: React.FC = () => {
  return (
    <EventProvider>
      <Router>
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/new" element={<CreateEvent />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/moderation/chat/:id" element={<ChatDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </EventProvider>
  );
};

export default App;