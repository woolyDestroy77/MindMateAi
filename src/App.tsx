import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Chat from './pages/Chat';
import AddictionSupport from './pages/AddictionSupport';
import AnxietySupport from './pages/AnxietySupport';

function App() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <LandingPage />
          } />
          <Route path="/dashboard" element={
            user ? <Dashboard /> : <Navigate to="/" replace />
          } />
          <Route path="/journal" element={
            user ? <Journal /> : <Navigate to="/" replace />
          } />
          <Route path="/chat" element={
            user ? <Chat /> : <Navigate to="/" replace />
          } />
          <Route path="/addiction-support" element={
            user ? <AddictionSupport /> : <Navigate to="/" replace />
          } />
          <Route path="/anxiety-support" element={
            user ? <AnxietySupport /> : <Navigate to="/" replace />
          } />
        </Routes>
        <Toaster position="top-right" />
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;