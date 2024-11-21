import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userHandle) => {
    try {
      const response = await fetch(`http://localhost:3000/api/messages/${userHandle}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/search?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientHandle: selectedUser,
          content: newMessage
        })
      });
      
      setNewMessage('');
      fetchMessages(selectedUser);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <div className="search-container">
          <input
            type="text"
            className="input search-input"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div
                  key={user.handle}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedUser(user.handle);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  @{user.handle}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedUser === conv.otherUser ? 'selected' : ''}`}
            onClick={() => setSelectedUser(conv.otherUser)}
          >
            <div className="conversation-user">@{conv.otherUser}</div>
            {conv.lastMessage && (
              <div className="conversation-preview">
                {conv.lastMessage.content.substring(0, 30)}
                {conv.lastMessage.content.length > 30 ? '...' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="messages-content">
        {selectedUser ? (
          <>
            <div className="messages-header">
              <h2>@{selectedUser}</h2>
            </div>
            <div className="messages-list">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender === selectedUser ? 'received' : 'sent'}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="message-input-container">
              <input
                type="text"
                className="input message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation or search for users to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
