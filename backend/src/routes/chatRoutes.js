import express from 'express';
import chatController from '../controllers/chatController.js';
import chatHistoryService from '../services/chatHistoryService.js';

const router = express.Router();

/** CHAT: POST /api/chat */
router.post('/chat', async (req, res) => {
  try {
    return await chatController.chat(req, res);
  } catch (err) {
    console.error("❌ Route error (POST /chat):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/** GET ALL SESSIONS → /api/chat/sessions */
router.get('/chat/sessions', async (req, res) => {
  try {
    const sessions = await chatHistoryService.getSessions();
    return res.json(sessions);
  } catch (err) {
    console.error("❌ Route error (GET /chat/sessions):", err);
    return res.status(500).json({ error: "Failed to load sessions" });
  }
});

/** GET MESSAGES → /api/chat/messages/:sessionId */
router.get('/chat/messages/:sessionId', async (req, res) => {
  try {
    const messages = await chatHistoryService.getMessages(req.params.sessionId);
    return res.json(messages);
  } catch (err) {
    console.error("❌ Route error (GET /chat/messages):", err);
    return res.status(500).json({ error: "Failed to load messages" });
  }
});

/** DELETE SESSION */
router.delete('/chat/session/:id', async (req, res) => {
  try {
    const id = req.params.id;

    await chatHistoryService.deleteSession(id);

    return res.json({
      success: true,
      message: "Chat session deleted"
    });

  } catch (err) {
    console.error("❌ Delete session error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete session" });
  }
});

/** RENAME SESSION */
router.put('/chat/session/:id/rename', async (req, res) => {
  try {
    const id = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    await chatHistoryService.renameSession(id, title);

    return res.json({
      success: true,
      message: "Session renamed"
    });

  } catch (err) {
    console.error("❌ Rename session error:", err);
    return res.status(500).json({ success: false, message: "Failed to rename session" });
  }
});

/** ARCHIVE SESSION */
router.put('/chat/session/:id/archive', async (req, res) => {
  try {
    const id = req.params.id;

    await chatHistoryService.archiveSession(id);

    return res.json({
      success: true,
      message: "Session archived"
    });

  } catch (err) {
    console.error("❌ Archive session error:", err);
    return res.status(500).json({ success: false, message: "Failed to archive session" });
  }
});

/** GET ANALYTICS → /api/chat/analytics */
router.get('/chat/analytics', async (req, res) => {
  try {
    const analytics = await chatHistoryService.getAnalytics();
    return res.json(analytics);
  } catch (err) {
    console.error("❌ Route error (GET /chat/analytics):", err);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;
