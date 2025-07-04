import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import LandingPage from './pages/LandingPage';

// Lazy load components to improve initial load time
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journal = lazy(() => import('./pages/Journal'));
const Chat = lazy(() => import('./pages/Chat'));
const AddictionSupport = lazy(() => import('./pages/AddictionSupport'));
const AnxietySupport = lazy(() => import('./pages/AnxietySupport'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CreateBlogPost = lazy(() => import('./pages/CreateBlogPost'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600"></div>
  </div>
);

function App() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <LandingPage />
          } />
          <Route path="/dashboard" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/journal" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <Journal />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/chat" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <Chat />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/addiction-support" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <AddictionSupport />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/anxiety-support" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <AnxietySupport />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/blog" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <Blog />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/blog/post/:id" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <BlogPost />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
          <Route path="/blog/create" element={
            user ? (
              <Suspense fallback={<LoadingFallback />}>
                <CreateBlogPost />
              </Suspense>
            ) : <Navigate to="/" replace />
          } />
        </Routes>
        <Toaster position="top-right" />
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;