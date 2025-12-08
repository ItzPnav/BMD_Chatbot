import React from 'react';
import { ChatIcon } from '../../assets/icons';
import styles from './FloatingChatButton.module.css';

/**
 * Floating chat button component
 * Fixed bottom-right circular button that opens the chat popup
 */
export const FloatingChatButton = ({ onClick, ariaLabel = 'Open chat' }) => {
  return (
    <button
      className={styles.floatingButton}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      <ChatIcon size={28} className={styles.icon} />
    </button>
  );
};

