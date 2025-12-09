import db from '../config/database.js';

class ChatHistoryService {
  async createSession(title = "New Chat") {
    const result = await db.query(
      `INSERT INTO chat_sessions (title) VALUES ($1) RETURNING *`,
      [title]
    );
    return result.rows[0];
  }

  async saveMessage(sessionId, role, content) {
    await db.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)`,
      [sessionId, role, content]
    );
  }

  async getSessions() {
    const result = await db.query(
      `SELECT * FROM chat_sessions WHERE archived = false ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getMessages(sessionId) {
    const result = await db.query(
      `SELECT id, role, content, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return result.rows;
  }

  async deleteSession(sessionId) {
    await db.query(`DELETE FROM chat_messages WHERE session_id = $1`, [sessionId]);
    await db.query(`DELETE FROM chat_sessions WHERE id = $1`, [sessionId]);
  }

  async renameSession(sessionId, newTitle) {
    await db.query(
      `UPDATE chat_sessions SET title = $1 WHERE id = $2`,
      [newTitle, sessionId]
    );
  }

  async archiveSession(sessionId) {
    await db.query(
      `UPDATE chat_sessions SET archived = true WHERE id = $1`,
      [sessionId]
    );
  }

  async saveFeedbackRating(messageId, sessionId, ratingType) {
    // First check if this rating already exists for this message
    const existingRating = await db.query(`
      SELECT id FROM feedback_ratings
      WHERE message_id = $1 AND rating_type = $2
    `, [messageId, ratingType]);

    if (existingRating.rows.length > 0) {
      throw new Error(`Rating already exists for this message: ${ratingType}`);
    }

    // Remove opposite rating if it exists (like/dislike are mutually exclusive per message)
    const oppositeRating = ratingType === 'like' ? 'dislike' : 'like';
    await db.query(`
      DELETE FROM feedback_ratings
      WHERE message_id = $1 AND rating_type = $2
    `, [messageId, oppositeRating]);

    // Insert new rating
    const result = await db.query(`
      INSERT INTO feedback_ratings (message_id, session_id, rating_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [messageId, sessionId, ratingType]);

    return result.rows[0];
  }

  async removeFeedbackRating(messageId, ratingType) {
    await db.query(`
      DELETE FROM feedback_ratings
      WHERE message_id = $1 AND rating_type = $2
    `, [messageId, ratingType]);
  }

  async getMessageRatings(messageId) {
    const result = await db.query(`
      SELECT rating_type, created_at
      FROM feedback_ratings
      WHERE message_id = $1
      ORDER BY created_at DESC
    `, [messageId]);

    return result.rows;
  }

  async getAnalytics() {
    // Get chat sessions created per day for last 7 days
    const sessionsByDate = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM chat_sessions
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND archived = false
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get messages per hour for last 24 hours
    const messagesByHour = await db.query(`
      SELECT
        EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*)::int as count
      FROM chat_messages
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `);

    // Get message distribution (user vs assistant)
    const messageDistribution = await db.query(`
      SELECT
        role,
        COUNT(*)::int as count
      FROM chat_messages
      GROUP BY role
    `);

    // Get feedback ratings analytics
    const feedbackDistribution = await db.query(`
      SELECT
        rating_type,
        COUNT(*)::int as count
      FROM feedback_ratings
      GROUP BY rating_type
    `);

    // Get feedback ratings per day for last 7 days
    const feedbackPerDay = await db.query(`
      SELECT
        DATE(created_at) as date,
        rating_type,
        COUNT(*)::int as count
      FROM feedback_ratings
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), rating_type
      ORDER BY date ASC, rating_type
    `);

    // Get total stats
    const totalStats = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM chat_sessions WHERE archived = false) as total_sessions,
        (SELECT COUNT(*)::int FROM chat_messages) as total_messages,
        (SELECT COUNT(*)::int FROM chat_messages WHERE role = 'user') as user_messages,
        (SELECT COUNT(*)::int FROM chat_messages WHERE role = 'assistant') as assistant_messages,
        (SELECT COUNT(*)::int FROM feedback_ratings) as total_ratings,
        (SELECT COUNT(*)::int FROM feedback_ratings WHERE rating_type = 'like') as total_likes,
        (SELECT COUNT(*)::int FROM feedback_ratings WHERE rating_type = 'dislike') as total_dislikes
    `);

    return {
      sessionsByDate: sessionsByDate.rows,
      messagesByHour: messagesByHour.rows,
      messageDistribution: messageDistribution.rows,
      feedbackDistribution: feedbackDistribution.rows,
      feedbackPerDay: feedbackPerDay.rows,
      totalStats: totalStats.rows[0] || {}
    };
  }
}

export default new ChatHistoryService();
