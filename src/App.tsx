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
const TherapistPlatform = lazy(() => import('./pages/TherapistPlatform'));
const TherapistRegistration = lazy(() => import('./pages/TherapistRegistration'));
const TherapistDashboard = lazy(() => import('./pages/TherapistDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

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
            user ? (
              user.user_metadata?.user_type === 'therapist' || user.user_metadata?.is_therapist 
                ? <Navigate to="/therapist-dashboard" replace />
                : <Navigate to="/dashboard" replace />
            ) : <LandingPage />
          } />
          <Route path="/dashboard" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/journal" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <Journal />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/chat" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <Chat />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/addiction-support" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <AddictionSupport />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/anxiety-support" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <AnxietySupport />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/blog" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <Blog />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/blog/post/:id" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <BlogPost />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/blog/create" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <CreateBlogPost />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/therapists" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <TherapistPlatform />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/become-therapist" element={
            user && user.user_metadata?.user_type !== 'therapist' && !user.user_metadata?.is_therapist ? (
              <Suspense fallback={<LoadingFallback />}>
                <TherapistRegistration />
              </Suspense>
            ) : user ? <Navigate to="/therapist-dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/therapist-dashboard" element={
            user && (user.user_metadata?.user_type === 'therapist' || user.user_metadata?.is_therapist) ? (
              <Suspense fallback={<LoadingFallback />}>
                <TherapistDashboard />
              </Suspense>
            ) : user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/admin" element={
            user && user.email === 'youssef.arafat09@gmail.com' ? (
              <Suspense fallback={<LoadingFallback />}>
                <AdminPanel />
              </Suspense>
            ) : user ? (
              user.user_metadata?.user_type === 'therapist' || user.user_metadata?.is_therapist 
                ? <Navigate to="/therapist-dashboard" replace />
                : <Navigate to="/dashboard" replace />
            ) : <Navigate to="/" replace />
          } />
        </Routes>
        <Toaster position="top-right" />
      </NotificationProvider>
    }
    </BrowserRouter>
  )
  );
}

export default App;