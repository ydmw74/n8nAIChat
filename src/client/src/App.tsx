import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import './styles/App.css';

// Layout components
import Header from './components/layout/Header';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy loaded pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Private route wrapper component
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  const { theme } = useTheme();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`app ${theme}-theme`}>
      <Header />
      <main className="main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat/:id?" element={<PrivateRoute element={<ChatPage />} />} />
            <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
            <Route path="/" element={<Navigate to="/chat" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
