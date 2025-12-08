import React from 'react';
import styles from './MarkdownRenderer.module.css';

/**
 * Simple markdown renderer for chat messages
 * Handles headers, bold, italic, lists, links, and code blocks
 */
export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Split content into lines for processing
  const lines = content.split('\n');
  const elements = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let listItems = [];
  let inList = false;

  const processParagraph = (para) => {
    if (para.length === 0) return null;
    
    const text = para.join(' ').trim();
    if (!text) return null;
    
    return <p key={elements.length} className={styles.paragraph}>{processInlineMarkdown(text)}</p>;
  };

  const processInlineMarkdown = (text) => {
    const parts = [];
    
    // Patterns for markdown (order matters - more specific patterns first)
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, tag: 'strong' }, // Bold (must come before italic)
      { regex: /`(.*?)`/g, tag: 'code' }, // Inline code
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, tag: 'link' }, // Links
      { regex: /\*(.*?)\*/g, tag: 'em' }, // Italic (after bold to avoid conflicts)
    ];

    let lastIndex = 0;
    const matches = [];
    
    // Collect all matches
    patterns.forEach(({ regex, tag }) => {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1] || match[2],
          href: match[2],
          tag,
          fullMatch: match[0]
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Filter out overlapping matches (keep the first/longest one)
    const nonOverlappingMatches = [];
    matches.forEach((match) => {
      const overlaps = nonOverlappingMatches.some(existing => 
        (match.start < existing.end && match.end > existing.start)
      );
      if (!overlaps) {
        nonOverlappingMatches.push(match);
      }
    });

    // Build parts
    nonOverlappingMatches.forEach((match) => {
      // Add text before match
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        if (beforeText) {
          parts.push(<span key={`text-${lastIndex}`}>{beforeText}</span>);
        }
      }

      // Add matched element
      if (match.tag === 'strong') {
        parts.push(<strong key={`strong-${match.start}`}>{match.content}</strong>);
      } else if (match.tag === 'em') {
        parts.push(<em key={`em-${match.start}`}>{match.content}</em>);
      } else if (match.tag === 'code') {
        parts.push(<code key={`code-${match.start}`} className={styles.inlineCode}>{match.content}</code>);
      } else if (match.tag === 'link') {
        parts.push(
          <a key={`link-${match.start}`} href={match.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {match.content}
          </a>
        );
      }

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={elements.length} className={styles.codeBlock}>
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        if (currentParagraph.length > 0) {
          elements.push(processParagraph(currentParagraph));
          currentParagraph = [];
        }
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle headers
    if (trimmed.startsWith('#')) {
      if (currentParagraph.length > 0) {
        elements.push(processParagraph(currentParagraph));
        currentParagraph = [];
      }
      if (inList) {
        elements.push(<ul key={elements.length} className={styles.list}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }

      const level = trimmed.match(/^#+/)[0].length;
      const headerText = trimmed.replace(/^#+\s*/, '');
      const HeaderTag = `h${Math.min(level, 6)}`;
      elements.push(
        React.createElement(HeaderTag, { key: elements.length, className: styles[`h${level}`] }, 
          processInlineMarkdown(headerText)
        )
      );
      return;
    }

    // Handle list items
    if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
      if (currentParagraph.length > 0) {
        elements.push(processParagraph(currentParagraph));
        currentParagraph = [];
      }
      const listText = trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(
        <li key={listItems.length} className={styles.listItem}>
          {processInlineMarkdown(listText)}
        </li>
      );
      inList = true;
      return;
    }

    // Handle horizontal rules
    if (trimmed === '---' || trimmed === '***') {
      if (currentParagraph.length > 0) {
        elements.push(processParagraph(currentParagraph));
        currentParagraph = [];
      }
      if (inList) {
        elements.push(<ul key={elements.length} className={styles.list}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(<hr key={elements.length} className={styles.hr} />);
      return;
    }

    // Regular paragraph line
    if (trimmed) {
      currentParagraph.push(trimmed);
    } else {
      // Empty line - end current paragraph/list
      if (currentParagraph.length > 0) {
        elements.push(processParagraph(currentParagraph));
        currentParagraph = [];
      }
      if (inList) {
        elements.push(<ul key={elements.length} className={styles.list}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }
    }
  });

  // Handle remaining content
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key={elements.length} className={styles.codeBlock}>
        <code>{codeBlockContent.join('\n')}</code>
      </pre>
    );
  }
  if (currentParagraph.length > 0) {
    elements.push(processParagraph(currentParagraph));
  }
  if (inList && listItems.length > 0) {
    elements.push(<ul key={elements.length} className={styles.list}>{listItems}</ul>);
  }

  return <div className={styles.markdown}>{elements}</div>;
};

