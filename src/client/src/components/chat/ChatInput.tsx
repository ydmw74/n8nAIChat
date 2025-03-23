import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSendMessage: (content: string, files: File[]) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && files.length === 0) return;
    
    // Don't allow sending if already in loading state
    if (isLoading) return;
    
    onSendMessage(trimmedMessage, files);
    
    // Reset form
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleTextareaResize = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <form className="chat-input-container" onSubmit={handleFormSubmit}>
      {files.length > 0 && (
        <div className="file-preview-list">
          {files.map((file, index) => (
            <div key={index} className="file-preview-item">
              <div className="file-preview-name">{file.name}</div>
              <button
                type="button"
                className="file-preview-remove"
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="input-row">
        <textarea
          className="message-textarea"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            handleMessageChange(e);
            handleTextareaResize(e);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        
        <div className="input-actions">
          <button
            type="button"
            className="attach-button"
            onClick={openFileSelector}
            disabled={isLoading}
            aria-label="Attach files"
          >
            <i className="fas fa-paperclip"></i>
          </button>
          
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || (message.trim() === '' && files.length === 0)}
            aria-label="Send message"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          multiple
        />
      </div>
    </form>
  );
};

export default ChatInput;
