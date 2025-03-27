import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/Settings.css';

interface Settings {
  id?: number;
  user_id?: number;
  n8n_webhook_url: string;
  n8n_binary_field: string;
  n8n_message_field: string;
  n8n_user_id_field: string;
  n8n_chat_id_field: string;
  n8n_session_id_field: string;
  theme: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    n8n_webhook_url: '',
    n8n_binary_field: 'data',
    n8n_message_field: 'message',
    n8n_user_id_field: 'userId',
    n8n_chat_id_field: 'chatId',
    n8n_session_id_field: 'sessionId',
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{success: boolean, message: string} | null>(null);

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Load user settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setSettings(res.data);
      } catch (err: any) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
    
    // Clear messages
    setError(null);
    setSuccess(null);
    setWebhookTestResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await axios.put('/api/settings', settings);
      setSuccess('Settings saved successfully');
      
      // Update theme if it changed
      if (theme !== settings.theme) {
        toggleTheme();
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!settings.n8n_webhook_url) {
      setError('Please enter a webhook URL first');
      return;
    }
    
    setTestingWebhook(true);
    setWebhookTestResult(null);
    setError(null);
    
    try {
      const res = await axios.post('/api/settings/test-webhook', {
        webhook_url: settings.n8n_webhook_url
      });
      
      setWebhookTestResult({
        success: true,
        message: res.data.message || 'Webhook connection successful'
      });
    } catch (err: any) {
      setWebhookTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to connect to webhook'
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2>n8n Integration</h2>
          <p className="settings-description">
            Configure the n8n webhook URL to process chat messages and files.
          </p>
          
          <div className="form-group">
            <label htmlFor="n8n_webhook_url">n8n Webhook URL</label>
            <div className="webhook-input-group">
              <input
                type="text"
                id="n8n_webhook_url"
                name="n8n_webhook_url"
                value={settings.n8n_webhook_url}
                onChange={handleChange}
                placeholder="https://your-n8n-instance.com/webhook/path"
              />
              <button 
                type="button" 
                className="btn btn-secondary test-webhook-btn"
                onClick={testWebhook}
                disabled={testingWebhook || !settings.n8n_webhook_url}
              >
                {testingWebhook ? 'Testing...' : 'Test'}
              </button>
            </div>
            
            <div className="settings-section" style={{ marginTop: '15px' }}>
              <h3>Webhook Field Names</h3>
              <p className="settings-description">
                Customize the field names used in your webhook payload.
              </p>
              
              <div className="form-group">
                <label htmlFor="n8n_binary_field">Binary Field Name</label>
                <input
                  type="text"
                  id="n8n_binary_field"
                  name="n8n_binary_field"
                  value={settings.n8n_binary_field}
                  onChange={handleChange}
                  placeholder="data"
                />
                <div className="settings-help">
                  The field name to use for binary data (file uploads) in n8n. Default is "data".
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="n8n_message_field">Message Field Name</label>
                <input
                  type="text"
                  id="n8n_message_field"
                  name="n8n_message_field"
                  value={settings.n8n_message_field}
                  onChange={handleChange}
                  placeholder="message"
                />
                <div className="settings-help">
                  The field name for the message content. Default is "message".
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="n8n_user_id_field">User ID Field Name</label>
                <input
                  type="text"
                  id="n8n_user_id_field"
                  name="n8n_user_id_field"
                  value={settings.n8n_user_id_field}
                  onChange={handleChange}
                  placeholder="userId"
                />
                <div className="settings-help">
                  The field name for the user identifier. Default is "userId".
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="n8n_chat_id_field">Chat ID Field Name</label>
                <input
                  type="text"
                  id="n8n_chat_id_field"
                  name="n8n_chat_id_field"
                  value={settings.n8n_chat_id_field}
                  onChange={handleChange}
                  placeholder="chatId"
                />
                <div className="settings-help">
                  The field name for the chat identifier. Default is "chatId".
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="n8n_session_id_field">Session ID Field Name</label>
                <input
                  type="text"
                  id="n8n_session_id_field"
                  name="n8n_session_id_field"
                  value={settings.n8n_session_id_field}
                  onChange={handleChange}
                  placeholder="sessionId"
                />
                <div className="settings-help">
                  The field name for the session identifier. Default is "sessionId".
                </div>
              </div>
            </div>
            
            {webhookTestResult && (
              <div className={`webhook-test-result ${webhookTestResult.success ? 'success' : 'error'}`}>
                {webhookTestResult.success ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <i className="fas fa-exclamation-circle"></i>
                )}
                {webhookTestResult.message}
              </div>
            )}
            
            <div className="settings-help">
              This URL should point to a configured n8n webhook that will process your messages.
              Example: <code>http://localhost:5678/webhook/chat-process</code>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Appearance</h2>
          
          <div className="form-group">
            <label>Theme</label>
            <div className="theme-options">
              <label className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={handleChange}
                />
                <i className="fas fa-sun"></i>
                Light
              </label>
              
              <label className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={handleChange}
                />
                <i className="fas fa-moon"></i>
                Dark
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-actions">
          <button 
            type="submit" 
            className="btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
      
      <div className="settings-section">
        <h2>Account Information</h2>
        <div className="account-info">
          <div className="info-item">
            <label>Username</label>
            <div>{user?.username}</div>
          </div>
          <div className="info-item">
            <label>Email</label>
            <div>{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
