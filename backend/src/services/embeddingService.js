import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8088';

class EmbeddingService {
  /**
   * Generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts to embed
   * @param {string} task - "query" or "passage"
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async generateEmbeddings(texts, task = 'passage') {
    try {
      const response = await axios.post(`${EMBEDDINGS_SERVICE_URL}/embed`, {
        texts,
        task
      });

      return response.data.vectors;
    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Generate embedding for a single query
   * @param {string} query - Query text
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateQueryEmbedding(query) {
    const embeddings = await this.generateEmbeddings([query], 'query');
    return embeddings[0];
  }

  /**
   * Check if embedding service is healthy
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${EMBEDDINGS_SERVICE_URL}/health`);
      return response.data.ok === true;
    } catch (error) {
      console.error('Embeddings service health check failed:', error.message);
      return false;
    }
  }
}

export default new EmbeddingService();