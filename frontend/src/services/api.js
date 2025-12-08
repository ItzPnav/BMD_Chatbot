/**
 * Central API service with error handling and retry logic
 */

import { getCachedChats, cacheChats } from './localStorageKeys.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4455';

/**
 * Default fetch options
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Retry configuration
 */
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

/**
 * Sleep utility for retries
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (retries > 0 && !error.message.includes('HTTP')) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * API client class
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a GET request
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetchWithRetry(url, {
      ...defaultOptions,
      ...options,
      method: 'GET',
    });
    return response.json();
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...defaultOptions.headers };

    // Don't set Content-Type for FormData
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetchWithRetry(url, {
      ...defaultOptions,
      headers,
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...defaultOptions.headers };

    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetchWithRetry(url, {
      ...defaultOptions,
      headers,
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetchWithRetry(url, {
      ...defaultOptions,
      ...options,
      method: 'DELETE',
    });
    return response.json();
  }
}

// Export singleton instance
const api = new ApiClient();

// Chat API methods
export const chatAPI = {
  /**
   * Send a message to the backend chat API
   * Backend expects: { query, category?, conversationHistory?, sessionId? }
   * Backend returns: { answer, sources, confidence, sessionId }
   */
  sendMessage: async (chatId, text, conversationHistory = [], sessionId = null) => {
    try {
      const response = await api.post('/api/chat', {
        query: text,
        sessionId, // <- added
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      });

      // Extract sessionId (very important)
      const returnedSessionId = response.sessionId || sessionId;

      let answerText = '';

      if (response.answer) {
        answerText = response.answer;
      } else if (response.content && Array.isArray(response.content)) {
        answerText = response.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n\n');
      } else if (response.message) {
        answerText = response.message;
      } else {
        answerText = 'No response received';
      }

      return {
        id: Date.now().toString(),
        text: answerText,
        message: answerText,
        sources: response.sources || [],
        confidence: response.confidence || 'medium',
        usage: response.usage || {},
        sessionId: returnedSessionId // <- IMPORTANT
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  /**
   * Fetch all sessions from backend DB
   */
  getSessions: async () => {
    try {
      return await api.get('/api/chat/sessions');
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  },

  /**
   * Fetch messages for a specific session
   */
  getMessages: async (sessionId) => {
    try {
      return await api.get(`/api/chat/messages/${sessionId}`);
    } catch (error) {
      console.error('Failed to load messages for session:', sessionId, error);
      return [];
    }
  },

  getAnalytics: async () => {
    try {
      return await api.get('/api/chat/analytics');
    } catch (error) {
      console.error('Failed to load analytics:', error);
      return null;
    }
  }
};

// Admin API (unchanged except below)
export const adminAPI = {
  getFiles: async () => {
    try {
      const response = await api.get('/api/documents');
      if (response.success && response.data) {
        return response.data.map(doc => ({
          id: doc.id || doc.document_id,
          filename: doc.filename || doc.name,
          category: doc.category || 'history',
          size: doc.size || doc.content_size || 0,
          status: doc.processed ? 'processed' : 'not processed',
          chunk_count: doc.chunk_count || doc.chunks || 0,
          uploadedAt: doc.uploaded_at || doc.created_at || doc.timestamp,
          processed: doc.processed || (Number(doc.chunk_count || 0) > 0)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch files:', error);
      return [];
    }
  },

  uploadFile: async (file, category = 'history') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const response = await api.post('/api/documents/upload', formData);
      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Upload failed');
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  },

  deleteFile: async (id) => {
    try {
      const response = await api.delete(`/api/documents/${id}`);
      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Delete failed');
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  replaceFile: async (id, file, category = 'history') => {
    try {
      await adminAPI.deleteFile(id);
      const uploadResult = await adminAPI.uploadFile(file, category);

      // Auto-process the new file to regenerate embeddings
      if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
        const newFileId = uploadResult.files[0].id;
        try {
          await adminAPI.generateEmbeddings([newFileId]);
        } catch (processError) {
          console.warn('Auto-processing failed for replaced file:', processError.message);
          // Don't fail the entire operation if processing fails
        }
      }

      return uploadResult;
    } catch (error) {
      console.error('Failed to replace file:', error);
      throw error;
    }
  },

  generateEmbeddings: async (fileIds) => {
    try {
      const results = [];

      for (const id of fileIds) {
        const response = await api.post(`/api/documents/process/${id}`);

        results.push({
          id,
          success: response.success || false,
          message: response.message || 'No message returned',
        });
      }

      return {
        success: true,
        message: "Embedding generation complete",
        results,
      };
    } catch (error) {
      console.error("Failed to generate embeddings:", error);
      return {
        success: false,
        message: "Embedding generation failed",
        error: error.message,
      };
    }
  },

  getAllChats: async () => {
    try {
      const sessions = await chatAPI.getSessions();
      // Transform sessions to match expected format
      return sessions.map(s => ({
        id: s.id,
        title: s.title || 'New Chat',
        lastMessageSnippet: '',
        lastActiveAt: s.created_at,
        createdAt: s.created_at
      }));
    } catch (error) {
      console.error('Failed to load chats:', error);
      return [];
    }
  }
};

export default api;
