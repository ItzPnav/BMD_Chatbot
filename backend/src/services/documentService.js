// backend/src/services/documentService.js

import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import embeddingService from './embeddingService.js';
import { chunkText, toPgVector } from '../utils/vectorUtils.js';

const documentsDir = path.join(process.cwd(), 'data', 'documents');

class DocumentService {
  async createDocument(filename, file_type, content, category) {
    const result = await db.query(
      `INSERT INTO documents (filename, file_type, content, category, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [filename, file_type, content, category, {}]
    );
    return result.rows[0];
  }

  /**
   * List all documents.
   * Uses a performant per-row COUNT(*) subquery to get embedding counts:
   * SELECT COUNT(*) FROM embeddings WHERE document_id = d.id
   */
  async getAllDocuments() {
    const result = await db.query(
      `SELECT
        d.id,
        d.filename,
        d.category,
        d.upload_date,
        d.file_type,
        LENGTH(d.content) as content_size,
        (SELECT COUNT(*) FROM embeddings e WHERE e.document_id = d.id) AS chunk_count
     FROM documents d
     ORDER BY d.upload_date DESC`
    );

    // Map backend rows to frontend-friendly format
    return result.rows.map((row) => {
      // Get file size from actual file if it exists
      let fileSize = 0;
      try {
        const filePath = path.join(documentsDir, row.category, row.filename);
        if (fs.existsSync(filePath)) {
          fileSize = fs.statSync(filePath).size;
        }
      } catch (error) {
        console.warn(`Could not get file size for ${row.filename}:`, error.message);
      }

      return {
        ...row,
        size: fileSize,
        status: row.chunk_count > 0 ? "processed" : "unprocessed",
        processed: row.chunk_count > 0
      };
    });
  }


  async getDocumentEmbeddingCount(id) {
    const res = await db.query(
      `SELECT COUNT(*)::int AS count FROM embeddings WHERE document_id = $1`,
      [id]
    );
    return res.rows[0].count;
  }

  async deleteDocument(id) {
    await db.query(`DELETE FROM embeddings WHERE document_id = $1`, [id]);

    const res = await db.query(`SELECT filename, category FROM documents WHERE id = $1`, [id]);
    if (res.rows.length) {
      const filePath = path.join(documentsDir, res.rows[0].category, res.rows[0].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }

  async searchDocumentsByQuery(query, topK) {
    return []; // unchanged
  }

  async processDocumentById(id) {
    const res = await db.query(
      `SELECT filename, category, content FROM documents WHERE id = $1`,
      [id]
    );

    if (!res.rows.length) throw new Error("Document not found");

    const { filename, category, content } = res.rows[0];

    await db.query(`DELETE FROM embeddings WHERE document_id = $1`, [id]);

    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const [embedding] = await embeddingService.generateEmbeddings([chunks[i]], "passage");
      const vector = toPgVector(embedding);

      await db.query(
        `INSERT INTO embeddings (document_id, chunk_text, chunk_index, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [id, chunks[i], i, vector]
      );
    }

    return chunks.length;
  }
  async searchSimilar(query, topK = 15, threshold = 0.1, category = null) {
    // 1. Generate query embedding
    const [embedding] = await embeddingService.generateEmbeddings([query], "query");
    const vector = toPgVector(embedding);

    // 2. Run pgvector similarity search
    const sql = `
    SELECT 
      e.document_id,
      e.chunk_text AS text,
      e.chunk_index,
      d.filename,
      1 - (e.embedding <-> $1::vector) AS similarity
    FROM embeddings e
    JOIN documents d ON e.document_id = d.id
    ${category ? `WHERE d.category = $3` : ""}
    ORDER BY e.embedding <-> $1::vector
    LIMIT $2
  `;

    const params = category ? [vector, topK, category] : [vector, topK];

    const result = await db.query(sql, params);

    // Debug: Log top results before filtering
    if (result.rows.length > 0) {
      console.log(`🔍 Found ${result.rows.length} chunks before threshold filter`);
      console.log(`📊 Top 3 similarity scores:`, result.rows.slice(0, 3).map(r => ({
        filename: r.filename,
        similarity: r.similarity.toFixed(4)
      })));
      console.log(`🎯 Threshold: ${threshold}`);
    } else {
      console.log(`⚠️ No embeddings found in database!`);
      // Check if embeddings table has any data
      const countResult = await db.query('SELECT COUNT(*) as count FROM embeddings');
      console.log(`📦 Total embeddings in DB: ${countResult.rows[0].count}`);
    }

    const filtered = result.rows.filter(r => r.similarity >= threshold);
    console.log(`✅ After threshold filter: ${filtered.length} chunks`);

    return filtered;
  }
}

export default new DocumentService();
