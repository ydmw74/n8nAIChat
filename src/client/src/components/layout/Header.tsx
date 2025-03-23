import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <i className="fas fa-robot"></i> n8n Chat
          </Link>

          <nav className="nav">
            {isAuthenticated ? (
              <>
                <Link to="/chat" className="nav-link">
                  <i className="fas fa-comment-dots"></i>
                  <span className="nav-text">Chats</span>
                </Link>
                <Link to="/settings" className="nav-link">
                  <i className="fas fa-cog"></i>
                  <span className="nav-text">Settings</span>
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="nav-text">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <i className="fas fa-sign-in-alt"></i>
                  <span className="nav-text">Login</span>
                </Link>
                <Link to="/register" className="nav-link">
                  <i className="fas fa-user-plus"></i>
                  <span className="nav-text">Register</span>
                </Link>
              </>
            )}
            <button 
              onClick={toggleTheme} 
              className="nav-link theme-toggle"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <i className="fas fa-moon"></i>
              ) : (
                <i className="fas fa-sun"></i>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
