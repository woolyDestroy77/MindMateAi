import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';

function App() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard\" replace /> : <LandingPage />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard /> : <Navigate to="/\" replace />
        } />
        <Route path="/journal" element={
          user ? <Journal /> : <Navigate to="/\" replace />
        } />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;