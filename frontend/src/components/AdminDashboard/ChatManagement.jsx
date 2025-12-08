import React, { useState, useEffect } from 'react';
import { adminAPI, chatAPI } from '../../services/api';
import api from '../../services/api';
import { RefreshIcon } from '../../assets/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import styles from './AdminDashboard.module.css';

/**
 * Chat Management section component
 */
export const ChatManagement = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chatId) => {
    try {
      // Get the chat session info from the list
      const chatInfo = chats.find(c => c.id === chatId);
      if (!chatInfo) return;

      // Get messages for this session
      const messages = await chatAPI.getMessages(chatId);
      
      // Format messages to match expected structure
      const formattedMessages = messages.map(m => ({
        id: m.id,
        sender: m.role === 'user' ? 'user' : 'bot',
        text: m.content,
        timestamp: m.created_at
      }));

      // Create chat object with messages
      setSelectedChat({
        id: chatId,
        title: chatInfo.title || 'New Chat',
        messages: formattedMessages,
        lastMessageSnippet: formattedMessages.length > 0 
          ? formattedMessages[formattedMessages.length - 1].text.substring(0, 50)
          : 'No messages'
      });
    } catch (error) {
      console.error('Failed to load chat:', error);
      setSelectedChat(null);
    }
  };

  const handleExport = () => {
    if (!selectedChat) return;
    const dataStr = JSON.stringify(selectedChat, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${selectedChat.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!selectedChat || !confirm('Are you sure you want to delete this chat?')) {
      return;
    }
    try {
      await api.delete(`/api/chat/session/${selectedChat.id}`);
      setSelectedChat(null);
      loadChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    }
  };

  const handlePin = () => {
    if (!selectedChat) return;
    // Implement pin API call
    console.log('Pin chat:', selectedChat.id);
    alert('Pin functionality to be implemented');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessageSnippet?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Chat Management</h2>
      <div className={styles.chatManagementLayout}>
        <div className={styles.chatListPanel}>
          <div className={styles.chatListHeader}>
            <h3>All Chats ({chats.length})</h3>
            <Button variant="secondary" size="sm" onClick={loadChats} disabled={loading}>
              <Icon size={16}>
                <RefreshIcon size={16} />
              </Icon>
              Refresh
            </Button>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.chatListContent}>
            {loading ? (
              <div className={styles.loading}>Loading chats...</div>
            ) : filteredChats.length === 0 ? (
              <div className={styles.empty}>No chats found</div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.chatListItem} ${
                    selectedChat?.id === chat.id ? styles.active : ''
                  }`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className={styles.chatListItemTitle}>{chat.title || 'New Chat'}</div>
                  <div className={styles.chatListItemSnippet}>
                    {chat.lastMessageSnippet || 'No messages'}
                  </div>
                  <div className={styles.chatListItemTime}>
                    {formatTime(chat.createdAt || chat.lastActiveAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className={styles.chatDetailPanel}>
          {selectedChat ? (
            <>
              <div className={styles.chatDetailHeader}>
                <h3>{selectedChat.title || 'Chat Details'}</h3>
                <div className={styles.chatActions}>
                  <Button variant="secondary" size="sm" onClick={handleExport}>
                    Export
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handlePin}>
                    Pin
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDelete}>
                    Delete Chat
                  </Button>
                </div>
              </div>
              <div className={styles.chatMessages}>
                {selectedChat.messages?.length > 0 ? (
                  selectedChat.messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`${styles.chatMessage} ${
                        msg.sender === 'user' ? styles.userMessage : styles.botMessage
                      }`}
                    >
                      <div className={styles.chatMessageContent}>
                        {msg.sender === 'bot' ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          msg.text
                        )}
                      </div>
                      <div className={styles.chatMessageTime}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>No messages in this chat</div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Select a chat to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

