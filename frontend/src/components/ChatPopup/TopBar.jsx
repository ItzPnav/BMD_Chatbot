import React from 'react';
import { MaximizeIcon, MinimizeIcon, MicIcon, MicOffIcon } from '../../assets/icons';
import { Icon } from '../ui/Icon';
import styles from './ChatPopup.module.css';

/**
 * TopBar component for ChatPopup
 */
export const TopBar = ({
  onMaximize,
  onMinimize,
  micEnabled,
  onMicToggle
}) => {
  return (
    <div className={styles.topBar}>
      <h2 className={styles.title}>BMD AI</h2>
      <div className={styles.topBarActions}>
        <button
          className={styles.topBarButton}
          onClick={onMaximize}
          aria-label="Expand to fullscreen"
          type="button"
        >
          <Icon size={20}>
            <MaximizeIcon size={20} />
          </Icon>
        </button>
        <button
          className={styles.topBarButton}
          onClick={onMicToggle}
          aria-label={micEnabled ? 'Disable microphone' : 'Enable microphone'}
          type="button"
        >
          <Icon size={20}>
            {micEnabled ? <MicIcon size={20} /> : <MicOffIcon size={20} />}
          </Icon>
        </button>
        <button
          className={styles.topBarButton}
          onClick={onMinimize}
          aria-label="Minimize chat"
          type="button"
        >
          <Icon size={20}>
            <MinimizeIcon size={20} />
          </Icon>
        </button>
      </div>
    </div>
  );
};

