import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const RERANKER_URL = process.env.RERANKER_SERVICE_URL;

class RerankerService {
  async rerank(query, documents, topK) {
    try {
      console.log(`📡 Calling LOCAL reranker: ${RERANKER_URL}/rerank`);

      const payload = {
        query,
        passages: documents.map((d, i) => ({
          id: String(i),
          text: d.text
        })),
        topK
      };

      const response = await axios.post(`${RERANKER_URL}/rerank`, payload);
      const ranked = response.data;

      return ranked.map(item => {
        const doc = documents[parseInt(item.id)];
        return {
          text: doc.text,
          metadata: doc.metadata,
          score: item.score
        };
      });

    } catch (err) {
      console.error("❌ Local reranker error:", err);
      console.log("⚠️ Falling back to semantic ranking...");
      return documents
        .sort((a, b) => b.metadata.similarity - a.metadata.similarity)
        .slice(0, topK)
        .map((doc, i) => ({ ...doc, score: doc.metadata.similarity }));
    }
  }
  async healthCheck() {
    return { status: "ok" };
  }

}

export default new RerankerService();
