import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatWindow() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to ChatWave! 👋", type: 'received', timestamp: '10:30 AM' },
    { id: 2, text: "Thanks for using our bulk messaging service!", type: 'sent', timestamp: '10:31 AM' },
    { id: 3, text: "How can I help you today?", type: 'received', timestamp: '10:32 AM' },
  ]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      type: 'sent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="cw-card cw-fade-in-up">
      <div className="cw-card-header">
        <h2 className="cw-card-title">Live Chat Preview</h2>
        <p className="cw-card-subtitle">See how your messages will appear</p>
      </div>
      
      <div className="cw-chat-container">
        <div className="cw-chat-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`cw-chat-message ${
                message.type === 'sent' ? 'cw-chat-message-sent' : 'cw-chat-message-received'
              } cw-fade-in-up`}
            >
              <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                {message.text}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                opacity: 0.7, 
                marginTop: '4px',
                textAlign: message.type === 'sent' ? 'right' : 'left'
              }}>
                {message.timestamp}
              </div>
            </div>
          ))}
        </div>
        
        <div className="cw-chat-input-area">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="cw-chat-input"
          />
          <button
            onClick={handleSendMessage}
            className="cw-chat-send-btn"
            disabled={!inputMessage.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
