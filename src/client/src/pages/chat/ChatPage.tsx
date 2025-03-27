import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ChatPage.css';

interface Chat {
  id: number;
  title: string;
  session_id?: string;
  created_at: string;
}

interface Message {
  id: number;
  chat_id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  files?: {
    id: number;
    filename: string;
    filepath: string;
    mimetype: string;
  }[];
}

const ChatPage: React.FC = () => {
  const { id: chatId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch all chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get('/api/chat');
        setChats(res.data);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats');
      }
    };
    
    fetchChats();
  }, []);
  
  // Fetch current chat and messages when chatId changes
  useEffect(() => {
    const fetchCurrentChat = async () => {
      if (!chatId) {
        setCurrentChat(null);
        setMessages([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await axios.get(`/api/chat/${chatId}`);
        setCurrentChat(res.data.chat);
        setMessages(res.data.messages || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching chat:', err);
        if (err.response?.status === 404) {
          navigate('/chat');
        } else {
          setError(err.response?.data?.msg || 'Failed to load chat');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentChat();
  }, [chatId, navigate]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleNewChat = async () => {
    try {
      const res = await axios.post('/api/chat', { title: 'New Chat' });
      
      // Add to chats list
      setChats(prevChats => [res.data, ...prevChats]);
      
      // Navigate to the new chat
      navigate(`/chat/${res.data.id}`);
      
      // Close mobile menu if open
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Error creating new chat:', err);
      setError('Failed to create new chat');
    }
  };
  
  const handleDeleteChat = async (id: number) => {
    try {
      await axios.delete(`/api/chat/${id}`);
      
      // Remove from chats list
      setChats(prevChats => prevChats.filter(chat => chat.id !== id));
      
      // If deleted chat is current chat, navigate to /chat
      if (chatId === id.toString()) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete chat');
    }
  };
  
  const handleSendMessage = async (content: string, files: File[]) => {
    console.log('Sending message:', content);
    console.log('Files:', files.map(f => f.name));
    
    if (sending) {
      console.log('Already sending a message, ignoring request');
      return;
    }
    
    if (!chatId) {
      // If no chat is selected, create a new one
      try {
        setSending(true);
        const res = await axios.post('/api/chat', { 
          title: content.slice(0, 30) + (content.length > 30 ? '...' : '') 
        });
        
        console.log('Created new chat:', res.data);
        
        // Add to chats list
        setChats(prevChats => [res.data, ...prevChats]);
        
        // Navigate to the new chat and send message there
        navigate(`/chat/${res.data.id}`);
        
        // We'll handle sending the message in the useEffect after navigation
        setSending(false);
        return;
      } catch (err) {
        console.error('Error creating new chat:', err);
        setError('Failed to create new chat');
        return;
      }
    }
    
    setSending(true);
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('content', content);
    
    // Add files to form data
    files.forEach(file => {
      console.log(`Appending file: ${file.name} (${file.type}, ${file.size} bytes)`);
      formData.append('files', file);
    });
    
    // Debug FormData contents
    console.log('FormData created with:');
    console.log('- content:', content);
    console.log('- files count:', files.length);
    console.log('- files:', files.map(f => f.name));
    
    try {
      console.log(`Sending request to /api/chat/${chatId}/message`);
      const res = await axios.post(`/api/chat/${chatId}/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Received response:', res.data);
      console.log('Response status:', res.status);
      
      // Update messages
      const { userMessage, assistantMessage } = res.data;
      setMessages(prevMessages => [...prevMessages, userMessage, assistantMessage]);
      
      // Update chat title if it's a new chat (only has 1 message)
      if (messages.length === 0 && content.trim()) {
        const titleText = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        setCurrentChat(prev => prev ? { ...prev, title: titleText } : null);
        
        // Also update in the chats list
        setChats(prevChats => prevChats.map(chat => 
          chat.id.toString() === chatId ? { ...chat, title: titleText } : chat
        ));
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
      }
      
      // Add user message to UI even if there's an error with the assistant response
      if (err.response?.data?.userMessage) {
        setMessages(prevMessages => [...prevMessages, err.response.data.userMessage]);
      }
      
      // Show error message
      if (err.response?.data?.assistantMessage) {
        setMessages(prevMessages => [...prevMessages, err.response.data.assistantMessage]);
      } else {
        setError('Failed to get response. Please check your n8n webhook settings.');
      }
    } finally {
      setSending(false);
    }
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };
  
  return (
    <div className="chat-page">
      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <ChatSidebar
          chats={chats}
          currentChatId={chatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          mobileView={true}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
      </div>
      
      <div className="chat-main">
        {!chatId ? (
          <div className="new-chat-placeholder">
            <div className="new-chat-content">
              <i className="fas fa-comment-dots"></i>
              <h2>n8n Chat</h2>
              <p>Send messages to your n8n workflow and get responses.</p>
              <button className="btn" onClick={handleNewChat}>
                Start a new chat
              </button>
            </div>
          </div>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="chat-header">
              <button 
                className="mobile-menu-toggle" 
                onClick={toggleMobileMenu}
                aria-label="Toggle chat list"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="chat-title">{currentChat?.title || 'New Chat'}</h2>
            </div>
            
            <div className="messages-container">
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <p>Send a message to start chatting</p>
                </div>
              ) : (
                messages.map(message => (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    role={message.role}
                    timestamp={message.created_at}
                    files={message.files}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <ChatInput onSendMessage={handleSendMessage} isLoading={sending} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
