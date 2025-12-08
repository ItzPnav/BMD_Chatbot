import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './TopBar';
import { ChatWindow } from './ChatWindow';
import { chatAPI } from '../../services/api';
import { ThumbsUpIcon, ThumbsDownIcon, CopyIcon } from '../../assets/icons';
import { Icon } from '../ui/Icon';
import api from '../../services/api.js';
import styles from './ChatPopup.module.css';

/**
 * Clean backend-driven ChatPopup
 * Shows only chat entry box with input field and send button
 * No existing chat list or new chat button
 */

export const ChatPopup = ({
  isOpen,
  onClose,
  onMaximize,
  currentChatId,
  onChatChange
}) => {
  const [micEnabled, setMicEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(currentChatId);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState(null);
  const messageRefs = useRef({});

  useEffect(() => {
    if (isOpen) {
      if (selectedChatId) loadChat(selectedChatId);
    }
  }, [isOpen, selectedChatId]);

  /** Load messages for a session from backend */
  const loadChat = async (id) => {
    if (!id) return;
    setLoading(true);

    try {
      const backendMessages = await chatAPI.getMessages(id);

      if (Array.isArray(backendMessages)) {
        const converted = backendMessages.map((m) => ({
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'bot',
          text: m.content,
          timestamp: m.created_at,
          status: 'sent'
        }));

        setMessages(converted);
        setSelectedChatId(id);
        onChatChange?.(id);
      }
    } catch (err) {
      console.error('Failed loading chat messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  /** Message constructor helpers */
  const makeUserMessage = (text) => ({
    id: Date.now().toString(),
    sender: 'user',
    text,
    timestamp: new Date().toISOString(),
    status: 'sending'
  });

  const makeAssistantMessage = (text) => ({
    id: `b-${Date.now()}`,
    sender: 'bot',
    text,
    timestamp: new Date().toISOString(),
    status: 'sent'
  });

  /** Sending a message */
  const handleSendMessage = async (text) => {
    if (!text?.trim()) return;

    const chatId = selectedChatId; // may be null for new chat

    const userMsg = makeUserMessage(text);
    const optimistic = [...messages, userMsg];

    setMessages(optimistic);

    // Build conversation history from existing messages (excluding the one we just added)
    const conversationHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    setLoading(true);
    try {
      const response = await chatAPI.sendMessage(
        chatId,
        text,
        conversationHistory,
        chatId
      );

      const assistantText = response.text || 'No response';
      const returnedSessionId = response.sessionId || chatId;

      const updatedMessages = [
        ...optimistic.slice(0, -1),
        { ...userMsg, status: 'sent' },
        makeAssistantMessage(assistantText)
      ];

      // Set correct session ID after backend creates it
      if (!selectedChatId && returnedSessionId) {
        setSelectedChatId(returnedSessionId);
      }

      setMessages(updatedMessages);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'error' } : m))
      );
    } finally {
      setLoading(false);
    }
  };

  /** Copy AI response as rendered text (not markdown) */
  const handleCopyRenderedText = async (messageId) => {
    try {
      const messageElement = messageRefs.current[messageId];
      if (!messageElement) return;

      // Get all text content from the rendered markdown
      const textContent = messageElement.innerText || messageElement.textContent;

      await navigator.clipboard.writeText(textContent);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const messageElement = messageRefs.current[messageId];
      if (!messageElement) return;

      const textContent = messageElement.innerText || messageElement.textContent;
      const textArea = document.createElement('textarea');
      textArea.value = textContent;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  /** Handle thumbs up feedback */
  const handleThumbsUp = (messageId) => {
    setFeedbackMessageId(messageId);
    // TODO: Send feedback to backend
    console.log('Thumbs up for message:', messageId);
    setTimeout(() => setFeedbackMessageId(null), 2000);
  };

  /** Handle thumbs down feedback */
  const handleThumbsDown = (messageId) => {
    setFeedbackMessageId(messageId);
    // TODO: Send feedback to backend
    console.log('Thumbs down for message:', messageId);
    setTimeout(() => setFeedbackMessageId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div
        className={styles.popup}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <TopBar
          onMaximize={onMaximize}
          onMinimize={onClose}
          micEnabled={micEnabled}
          onMicToggle={() => setMicEnabled(!micEnabled)}
        />

        <div className={styles.popupContent}>
          <div className={styles.chatContainer}>
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              chatId={selectedChatId}
              loading={loading}
              onCopyRenderedText={handleCopyRenderedText}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              copiedMessageId={copiedMessageId}
              feedbackMessageId={feedbackMessageId}
              messageRefs={messageRefs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPopup;
