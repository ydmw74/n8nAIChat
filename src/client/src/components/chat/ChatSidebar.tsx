import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ChatSidebar.css';

interface Chat {
  id: number;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onNewChat: () => void;
  onDeleteChat: (id: number) => void;
  mobileView?: boolean;
  onCloseMobileMenu?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onNewChat,
  onDeleteChat,
  mobileView = false,
  onCloseMobileMenu
}) => {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleNewChat = () => {
    onNewChat();
    if (mobileView && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const handleChatClick = (chatId: number) => {
    if (mobileView && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const handleConfirmDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDelete(id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDelete(null);
  };

  const handleDeleteChat = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteChat(id);
    setConfirmDelete(null);
    
    // If we're deleting the current chat, navigate to /chat
    if (currentChatId === id.toString()) {
      navigate('/chat');
    }
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={handleNewChat}>
          <i className="fas fa-plus"></i> New Chat
        </button>
      </div>
      
      <div className="chats-list">
        {chats.length === 0 ? (
          <div className="no-chats">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          chats.map(chat => (
            <Link
              to={`/chat/${chat.id}`}
              key={chat.id}
              className={`chat-item ${currentChatId === chat.id.toString() ? 'active' : ''}`}
              onClick={() => handleChatClick(chat.id)}
            >
              <div className="chat-item-icon">
                <i className="fas fa-comment-dots"></i>
              </div>
              <div className="chat-item-content">
                <div className="chat-item-title">{chat.title}</div>
                <div className="chat-item-date">
                  {new Date(chat.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="chat-item-actions">
                {confirmDelete === chat.id ? (
                  <>
                    <button
                      className="chat-action-btn confirm-delete"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      aria-label="Confirm delete"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    <button
                      className="chat-action-btn cancel-delete"
                      onClick={handleCancelDelete}
                      aria-label="Cancel delete"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </>
                ) : (
                  <button
                    className="chat-action-btn delete-btn"
                    onClick={(e) => handleConfirmDelete(chat.id, e)}
                    aria-label="Delete chat"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
