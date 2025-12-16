// backend/src/routes/adminRoutes.js

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// RESET DATABASE - Delete all files and reset tables
router.post('/reset', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get counts before deletion for response
      const documentsCountResult = await client.query('SELECT COUNT(*) as count FROM documents');
      const embeddingsCountResult = await client.query('SELECT COUNT(*) as count FROM embeddings');
      const sessionsCountResult = await client.query('SELECT COUNT(*) as count FROM chat_sessions');
      const messagesCountResult = await client.query('SELECT COUNT(*) as count FROM chat_messages');
      
      const counts = {
        documentsDeleted: parseInt(documentsCountResult.rows[0].count),
        embeddingsDeleted: parseInt(embeddingsCountResult.rows[0].count),
        sessionsDeleted: parseInt(sessionsCountResult.rows[0].count),
        messagesDeleted: parseInt(messagesCountResult.rows[0].count)
      };
      
      // Delete data in correct order (respect foreign keys)
      await client.query('DELETE FROM feedback_ratings');
      await client.query('DELETE FROM chat_messages');
      await client.query('DELETE FROM chat_sessions');
      await client.query('DELETE FROM embeddings');
      await client.query('DELETE FROM documents');
      
      // Restart identity sequences
      await client.query('ALTER SEQUENCE documents_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE embeddings_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE chat_sessions_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE feedback_ratings_id_seq RESTART WITH 1');
      
      await client.query('COMMIT');
      
      console.log('🔄 Database reset completed:', counts);
      
      res.json({
        success: true,
        message: 'Database reset successfully',
        deletedRecords: counts,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Reset database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database',
      message: error.message
    });
  }
});

export default router;
