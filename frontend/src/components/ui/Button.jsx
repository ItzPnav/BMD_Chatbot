import React from 'react';
import styles from './Button.module.css';

/**
 * Reusable Button component with variants
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.disabled
 * @param {React.ReactNode} props.children
 * @param {string} props.className
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

