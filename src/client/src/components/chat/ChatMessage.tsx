import React, { useState } from 'react';
import './ChatMessage.css';

interface FileAttachment {
  id?: number;
  filename: string;
  filepath: string;
  mimetype: string;
}

interface ChatMessageProps {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  files?: FileAttachment[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  timestamp,
  files = []
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return 'fa-file-image';
    } else if (mimetype.startsWith('video/')) {
      return 'fa-file-video';
    } else if (mimetype.startsWith('audio/')) {
      return 'fa-file-audio';
    } else if (mimetype.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (
      mimetype.includes('word') ||
      mimetype.includes('document') ||
      mimetype.includes('msword')
    ) {
      return 'fa-file-word';
    } else if (
      mimetype.includes('excel') ||
      mimetype.includes('spreadsheet') ||
      mimetype.includes('sheet')
    ) {
      return 'fa-file-excel';
    } else if (
      mimetype.includes('presentation') ||
      mimetype.includes('powerpoint') ||
      mimetype.includes('ppt')
    ) {
      return 'fa-file-powerpoint';
    } else if (mimetype.includes('text/')) {
      return 'fa-file-alt';
    } else if (mimetype.includes('zip') || mimetype.includes('compressed')) {
      return 'fa-file-archive';
    } else if (mimetype.includes('code') || mimetype.includes('javascript') || mimetype.includes('json')) {
      return 'fa-file-code';
    } else {
      return 'fa-file';
    }
  };

  const isImageFile = (mimetype: string) => {
    return mimetype.startsWith('image/');
  };

  const toggleFileExpand = (filepath: string) => {
    if (expandedFile === filepath) {
      setExpandedFile(null);
    } else {
      setExpandedFile(filepath);
    }
  };

  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'assistant' ? (
          <i className="fas fa-robot"></i>
        ) : (
          <i className="fas fa-user"></i>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-text">{content}</div>
        
        {files && files.length > 0 && (
          <div className="message-files">
            {files.map((file, index) => (
              <div key={index} className="file-attachment">
                <div 
                  className="file-preview"
                  onClick={() => toggleFileExpand(file.filepath)}
                >
                  {isImageFile(file.mimetype) ? (
                    <img 
                      src={`/api/uploads/${file.filepath.split('/').pop()}`} 
                      alt={file.filename}
                      className="file-thumbnail"
                    />
                  ) : (
                    <i className={`fas ${getFileIcon(file.mimetype)}`}></i>
                  )}
                  <span className="file-name">{file.filename}</span>
                </div>
                
                {expandedFile === file.filepath && isImageFile(file.mimetype) && (
                  <div className="expanded-image-container">
                    <div className="expanded-image-backdrop" onClick={() => setExpandedFile(null)}></div>
                    <div className="expanded-image-content">
                      <img 
                        src={`/api/uploads/${file.filepath.split('/').pop()}`} 
                        alt={file.filename}
                        className="expanded-image"
                      />
                      <button 
                        className="close-expanded-image"
                        onClick={() => setExpandedFile(null)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {timestamp && (
          <div className="message-timestamp">
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
