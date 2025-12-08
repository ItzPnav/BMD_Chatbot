import React from 'react';
import styles from './ChatPopup.module.css';

/**
 * Compact chat history preview component
 */
export const ChatList = ({ chats = [], onSelectChat, selectedChatId }) => {
  if (chats.length === 0) {
    return (
      <div className={styles.chatListEmpty}>
        <p>No previous chats</p>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      {chats.slice(0, 3).map((chat) => (
        <button
          key={chat.id}
          className={`${styles.chatListItem} ${
            selectedChatId === chat.id ? styles.active : ''
          }`}
          onClick={() => onSelectChat(chat.id)}
          type="button"
        >
          <div className={styles.chatListItemTitle}>{chat.title || 'New Chat'}</div>
          <div className={styles.chatListItemSnippet}>
            {chat.lastMessageSnippet || 'No messages'}
          </div>
        </button>
      ))}
    </div>
  );
};

