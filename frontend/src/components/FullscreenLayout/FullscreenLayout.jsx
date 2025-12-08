import React, { useState, useEffect, useRef } from 'react';
import { MoreVerticalIcon, SendIcon, AttachmentIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, LoopIcon, SpeakerIcon } from '../../assets/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { chatAPI } from '../../services/api';
import api from '../../services/api';
import styles from './FullscreenLayout.module.css';

/**
 * Fully backend-driven fullscreen chat layout
 * - Uses chatAPI.getSessions()
 * - Uses chatAPI.getMessages(id)
 * - Backend creates sessionId on first message
 * - No localStorage fake chats
 */

export const FullscreenLayout = ({
  currentChatId,
  onChatChange,
  onClose
}) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentChatId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    if (selectedSessionId) loadMessages(selectedSessionId);
  }, []);

  // Reload messages when selecting a chat
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
      onChatChange?.(selectedSessionId);
    }
  }, [selectedSessionId]);

  /** Load sessions from backend */
  const loadSessions = async () => {
    try {
      const data = await chatAPI.getSessions(); // backend based
      const normalized = data.map(s => ({
        id: s.id,
        title: s.title || 'New Chat',
        lastMessageSnippet: '',
      }));
      setSessions(normalized);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  /** Load messages for a session from backend */
  const loadMessages = async (sessionId) => {
    try {
      const msgs = await chatAPI.getMessages(sessionId);

      const formatted = msgs.map(m => ({
        id: m.id,
        sender: m.role === 'user' ? 'user' : 'bot',
        text: m.content,
        timestamp: m.created_at,
        status: 'sent'
      }));

      setMessages(formatted);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  /** New Chat → clear UI and wait for backend to create session on first message */
  const handleCreateNewChat = () => {
    setSelectedSessionId(null);
    setMessages([]);
  };

  /** Sending a message */
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const sessionId = selectedSessionId; // may be null (backend creates)

    const userMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    setInput('');
    setLoading(true);

    // Build conversation history from existing messages (excluding the one we just added)
    const conversationHistory = messages.map(m => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await chatAPI.sendMessage(
        sessionId,
        userMessage.text,
        conversationHistory,
        sessionId
      );

      const botMessage = {
        id: 'b-' + Date.now(),
        sender: 'bot',
        text: response.text || 'No response',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      const updated = [
        ...optimistic.slice(0, -1),
        { ...userMessage, status: 'sent' },
        botMessage
      ];

      setMessages(updated);

      // If backend generated new sessionId
      if (!selectedSessionId && response.sessionId) {
        setSelectedSessionId(response.sessionId);
      }

      await loadSessions(); // refresh sidebar
    } catch (error) {
      console.error('Failed to send message:', error);
      const errored = optimistic.map(m =>
        m.id === userMessage.id ? { ...m, status: 'error' } : m
      );
      setMessages(errored);
    } finally {
      setLoading(false);
    }
  };

  /** Chat sidebar actions */
  const handleRenameSession = async (id) => {
    const newTitle = window.prompt('Enter new title:');
    if (!newTitle) return;

    await api.put(`/api/chat/session/${id}/rename`, { title: newTitle });
    loadSessions();
  };

  const handleArchiveSession = async (id) => {
    if (!window.confirm('Archive this chat?')) return;

    await api.put(`/api/chat/session/${id}/archive`);
    loadSessions();

    if (selectedSessionId === id) {
      setSelectedSessionId(null);
      setMessages([]);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Delete this chat?')) return;

    await api.delete(`/api/chat/session/${id}`);
    loadSessions();

    if (selectedSessionId === id) {
      setSelectedSessionId(null);
      setMessages([]);
    }
  };

  /** UI Helpers */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  /** Auto-resize textarea */
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  /** Keyboard handling - Enter to send, Shift+Enter to expand */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow Shift+Enter to create new lines (textarea will expand automatically)
        setTimeout(adjustTextareaHeight, 0);
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
      }
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

  /** Handle try again - regenerate response */
  const handleTryAgain = async (messageId) => {
    // Find the message and get the previous user message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    // Find the user message before this bot response
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].sender !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      // Remove the bot response and any messages after it
      const updatedMessages = messages.slice(0, messageIndex);
      setMessages(updatedMessages);
      
      // Resend the user message
      const userText = userMessage.text;
      setInput(userText);
      
      // Wait for state update, then send
      setTimeout(async () => {
        if (!userText.trim() || loading) return;

        const sessionId = selectedSessionId;

        const userMsg = {
          id: 'u-' + Date.now(),
          sender: 'user',
          text: userText.trim(),
          timestamp: new Date().toISOString(),
          status: 'sending'
        };

        const optimistic = [...updatedMessages, userMsg];
        setMessages(optimistic);
        setInput('');
        setLoading(true);

        const conversationHistory = updatedMessages.map(m => ({
          sender: m.sender,
          text: m.text
        }));

        try {
          const response = await chatAPI.sendMessage(
            sessionId,
            userMsg.text,
            conversationHistory,
            sessionId
          );

          const botMessage = {
            id: 'b-' + Date.now(),
            sender: 'bot',
            text: response.text || 'No response',
            timestamp: new Date().toISOString(),
            status: 'sent'
          };

          const finalMessages = [
            ...optimistic.slice(0, -1),
            { ...userMsg, status: 'sent' },
            botMessage
          ];

          setMessages(finalMessages);

          if (!selectedSessionId && response.sessionId) {
            setSelectedSessionId(response.sessionId);
          }

          await loadSessions();
        } catch (error) {
          console.error('Failed to send message:', error);
          const errored = optimistic.map(m =>
            m.id === userMsg.id ? { ...m, status: 'error' } : m
          );
          setMessages(errored);
        } finally {
          setLoading(false);
        }
      }, 100);
    }
  };

  /** Handle read aloud */
  const handleReadAloud = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (!messageElement) return;

    const textContent = messageElement.innerText || messageElement.textContent;
    
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      setSpeakingMessageId(messageId);
      
      utterance.onend = () => {
        setSpeakingMessageId(null);
      };

      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  return (
    <div className={styles.fullscreen}>
      {/* LEFT SIDE */}
      <div className={styles.leftSector}>
        <div className={styles.leftHeader}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateNewChat}
            className={styles.newChatButton}
          >
            + New Chat
          </Button>
        </div>

        <div className={styles.chatList}>
          {sessions.length === 0 ? (
            <div className={styles.emptyChats}>
              <p>No chats yet. Start a new conversation!</p>
            </div>
          ) : (
            sessions.map((chat) => (
              <div
                key={chat.id}
                className={`${styles.chatItem} ${
                  selectedSessionId === chat.id ? styles.active : ''
                }`}
                onClick={() => setSelectedSessionId(chat.id)}
              >
                <div className={styles.chatItemContent}>
                  <div className={styles.chatItemTitle}>{chat.title}</div>
                  <div className={styles.chatItemSnippet}>
                    {chat.lastMessageSnippet || ''}
                  </div>
                </div>

                <div className={styles.chatItemMenu}>
                  <button
                    className={styles.menuButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === chat.id ? null : chat.id);
                    }}
                    aria-label="Chat options"
                  >
                    <Icon size={18}>
                      <MoreVerticalIcon size={18} />
                    </Icon>
                  </button>

                  {menuOpen === chat.id && (
                    <div className={styles.menuDropdown}>
                      <button onClick={() => handleRenameSession(chat.id)}>Rename</button>
                      <button onClick={() => handleArchiveSession(chat.id)}>Archive</button>
                      <button onClick={() => handleDeleteSession(chat.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className={styles.rightSector}>
        <div className={styles.messagesContainer}>
              {messages.map((msg, idx) => {
                const showDate =
                  idx === 0 ||
                  new Date(msg.timestamp).toDateString() !==
                    new Date(messages[idx - 1].timestamp).toDateString();

                return (
                  <React.Fragment key={msg.id || idx}>
                    {showDate && (
                      <div className={styles.dateDivider}>
                        {formatDate(msg.timestamp)}
                      </div>
                    )}

                    <div
                      className={`${styles.message} ${
                        msg.sender === 'user' ? styles.userMessage : styles.botMessage
                      }`}
                    >
                      <div 
                        ref={el => {
                          if (msg.sender === 'bot') {
                            messageRefs.current[msg.id] = el;
                          }
                        }}
                        className={styles.messageContent}
                      >
                        {msg.sender === 'bot' ? (
                          <>
                            <MarkdownRenderer content={msg.text} />
                          </>
                        ) : (
                          msg.text
                        )}
                      </div>
                      
                      {/* Action buttons for AI responses */}
                      {msg.sender === 'bot' && (
                        <div className={styles.messageActions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleCopyRenderedText(msg.id)}
                            title="Copy rendered text"
                            aria-label="Copy message"
                          >
                            <Icon size={18}>
                              <CopyIcon size={18} />
                            </Icon>
                            {copiedMessageId === msg.id && (
                              <span className={styles.actionFeedback}>Copied!</span>
                            )}
                          </button>
                          
                          <button
                            className={`${styles.actionButton} ${feedbackMessageId === msg.id ? styles.active : ''}`}
                            onClick={() => handleThumbsUp(msg.id)}
                            title="Good response"
                            aria-label="Thumbs up"
                          >
                            <Icon size={18}>
                              <ThumbsUpIcon size={18} />
                            </Icon>
                          </button>
                          
                          <button
                            className={`${styles.actionButton} ${feedbackMessageId === msg.id ? styles.active : ''}`}
                            onClick={() => handleThumbsDown(msg.id)}
                            title="Bad response"
                            aria-label="Thumbs down"
                          >
                            <Icon size={18}>
                              <ThumbsDownIcon size={18} />
                            </Icon>
                          </button>
                          
                          <button
                            className={styles.actionButton}
                            onClick={() => handleTryAgain(msg.id)}
                            title="Try again"
                            aria-label="Regenerate response"
                          >
                            <Icon size={18}>
                              <LoopIcon size={18} />
                            </Icon>
                          </button>
                          
                          <button
                            className={`${styles.actionButton} ${speakingMessageId === msg.id ? styles.active : ''}`}
                            onClick={() => {
                              if (speakingMessageId === msg.id) {
                                window.speechSynthesis.cancel();
                                setSpeakingMessageId(null);
                              } else {
                                handleReadAloud(msg.id);
                              }
                            }}
                            title="Read aloud"
                            aria-label="Read message aloud"
                          >
                            <Icon size={18}>
                              <SpeakerIcon size={18} />
                            </Icon>
                          </button>
                        </div>
                      )}
                      
                      <div className={styles.messageMeta}>
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.sender === 'user' && (
                          <span>
                            {msg.status === 'sent'
                              ? '✓'
                              : msg.status === 'error'
                              ? '✗'
                              : '…'}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {loading && (
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <div className={styles.typingWave}>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedSessionId && messages.length === 0 && (
                <div className={styles.emptyState}>
                  <h2>Start a new conversation</h2>
                  <p>Type a message below to begin chatting</p>
                </div>
              )}
            </div>

            <div className={styles.inputBar}>
              <button className={styles.attachmentButton}>
                <Icon size={20}>
                  <AttachmentIcon size={20} />
                </Icon>
              </button>

              <textarea
                ref={textareaRef}
                className={styles.input}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedSessionId ? "Type your message... (Enter to send, Shift+Enter for newline)" : "Start a new chat..."}
                rows={1}
                disabled={loading}
              />

              <button
                className={styles.sendButton}
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
              >
                <Icon size={20}>
                  <SendIcon size={20} />
                </Icon>
              </button>
            </div>
      </div>

      <button
        className={styles.mobileMenuButton}
        onClick={() => setShowMobileDrawer(true)}
      >
        ☰
      </button>
    </div>
  );
};
