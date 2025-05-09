import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classService from '../../services/classService';
import type { ChatMessage as ApiChatMessage } from '../../services/classService';
import './ClassChat.css';

// Chat message interface with additional client-side properties
interface ChatMessage extends ApiChatMessage {
  isCurrentUser?: boolean;
}

const ClassChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = parseInt(id || '0');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch messages from the API
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching chat messages for class ID:', classId);

      // Call the API to get chat messages
      const apiMessages = await classService.getChatMessages(classId);

      console.log('Received chat messages:', apiMessages);

      // Mark messages from the current user
      const messagesWithCurrentUser = apiMessages.map(msg => ({
        ...msg,
        isCurrentUser: msg.userId === user?.userId
      }));

      setMessages(messagesWithCurrentUser);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load chat messages');
      setIsLoading(false);
    }
  };

  // Fetch messages on component mount and set up polling
  useEffect(() => {
    // Create a function that captures the current classId
    const fetchMessagesForClass = () => {
      if (classId) {
        console.log(`ClassChat: Fetching messages for class ID ${classId}`);
        fetchMessages();
      } else {
        console.error('ClassChat: No valid class ID provided');
        setError('Invalid class ID');
        setIsLoading(false);
      }
    };

    fetchMessagesForClass();

    // Set up polling to refresh messages every 10 seconds
    const intervalId = setInterval(fetchMessagesForClass, 10000);

    // Clean up interval on component unmount
    return () => {
      console.log('ClassChat: Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [classId, user?.userId]); // Include dependencies

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      
      const messageContent = newMessage.trim();
      console.log('Sending chat message to class ID:', classId, 'Content:', messageContent);
      
      // Create a temporary message to display immediately
      const tempMessage: ChatMessage = {
        messageId: Date.now(), // Temporary ID
        classId: classId,
        userId: user?.userId || 0,
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email || 'You'),
        userRole: user?.userRole || 'student',
        content: messageContent,
        timestamp: new Date().toISOString(),
        isCurrentUser: true
      };
      
      // Add the message to the UI immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage(''); // Clear the input field

      // Then send the message to the API
      await classService.sendChatMessage(classId, messageContent)
        .catch(error => {
          console.error('Error sending message:', error);
          alert('Message sent, but error occurred synchronizing with server. Your message will appear after refresh.');
        });
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="chat-loading">
        <div className="chat-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <h3>Error Loading Chat</h3>
        <p>{error}</p>
        <div className="error-actions">
          {error.includes('Authentication') || error.includes('logged in') ? (
            <Link to={`/${user?.userRole}/login`} className="retry-button">
              Log In Again
            </Link>
          ) : (
            <button onClick={fetchMessages} className="retry-button">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="class-chat-container">
      <div className="chat-header">
        <h2>Class Chat</h2>
        <p className="chat-description">
          Discuss class topics, ask questions, and collaborate with classmates
        </p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              className={`chat-message ${message.isCurrentUser ? 'current-user' : ''} ${message.userRole === 'teacher' ? 'teacher' : 'student'}`}
            >
              <div className="message-avatar">
                {message.userName?.charAt(0) || '?'}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">{message.userName}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <div className="button-spinner"></div>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ClassChat;
