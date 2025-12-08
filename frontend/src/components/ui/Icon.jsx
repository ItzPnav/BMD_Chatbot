import React from 'react';
import styles from './Icon.module.css';

/**
 * Icon wrapper component with hover animations
 * @param {Object} props
 * @param {React.ReactNode} props.children - SVG icon component
 * @param {string} props.className
 * @param {number} props.size
 */
export const Icon = ({ children, className = '', size = 24, ...props }) => {
  return (
    <span
      className={`${styles.icon} ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </span>
  );
};

