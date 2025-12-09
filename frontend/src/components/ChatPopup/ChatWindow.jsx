import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, AttachmentIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from '../../assets/icons';
import { Icon } from '../ui/Icon';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import styles from './ChatPopup.module.css';

/**
 * ChatWindow component - main conversation view with input and message actions
 */
export const ChatWindow = ({
  messages = [],
  onSendMessage,
  chatId,
  loading = false,
  onCopyRenderedText,
  onThumbsUp,
  onThumbsDown,
  copiedMessageId,
  feedbackMessageId,
  messageRatings = {},
  messageRefs
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Start a conversation with BMD AI</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id || msg.timestamp}
              className={`${styles.message} ${
                msg.sender === 'user' ? styles.userMessage : styles.botMessage
              }`}
            >
              <div
                ref={el => {
                  if (msg.sender === 'bot' && messageRefs && el) {
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
              {msg.sender === 'bot' && onCopyRenderedText && (
                <div className={styles.messageActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => onCopyRenderedText(msg.id)}
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
                    className={`${styles.actionButton} ${messageRatings[msg.id] === 'like' ? styles.permanentActive : ''}`}
                    onClick={() => onThumbsUp(msg.id)}
                    title={messageRatings[msg.id] === 'like' ? "Remove thumbs up" : "Good response"}
                    aria-label="Thumbs up"
                  >
                    <Icon size={18}>
                      <ThumbsUpIcon size={18} />
                    </Icon>
                  </button>

                  <button
                    className={`${styles.actionButton} ${messageRatings[msg.id] === 'dislike' ? styles.permanentActive : ''}`}
                    onClick={() => onThumbsDown(msg.id)}
                    title={messageRatings[msg.id] === 'dislike' ? "Remove thumbs down" : "Bad response"}
                    aria-label="Thumbs down"
                  >
                    <Icon size={18}>
                      <ThumbsDownIcon size={18} />
                    </Icon>
                  </button>
                </div>
              )}

              <div className={styles.messageMeta}>
                <span className={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </span>
                {msg.sender === 'user' && (
                  <span className={styles.messageStatus}>
                    {msg.status === 'sent' ? '✓' : '⏳'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputBar}>
        <button
          className={styles.attachmentButton}
          aria-label="Attach file"
          type="button"
        >
          <Icon size={20}>
            <AttachmentIcon size={20} />
          </Icon>
        </button>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={loading}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          type="button"
        >
          <Icon size={20}>
            <SendIcon size={20} />
          </Icon>
        </button>
      </div>
    </div>
  );
};
