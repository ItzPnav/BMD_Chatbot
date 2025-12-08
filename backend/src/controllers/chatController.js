import Anthropic from '@anthropic-ai/sdk';
import documentService from '../services/documentService.js';
import rerankerService from '../services/rerankerService.js';
import chatHistoryService from '../services/chatHistoryService.js'; // <- NEW import

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class ChatController {
  async chat(req, res) {
    try {
      console.log(`\n${new Date().toISOString()} - POST /api/chat`);

      // ----------------------------
      // 0. Accept sessionId (optional)
      // ----------------------------
      // If frontend sends sessionId, we'll use it. Otherwise create new session.
      let sessionId = req.body?.sessionId || null;

      // ----------------------------
      // 1. Validate Input
      // ----------------------------
      const query = req.body?.query;
      const category = req.body?.category || null;
      const history = req.body?.conversationHistory || [];

      if (!query || typeof query !== 'string') {
        console.warn("⚠️ Invalid or missing 'query' in body:", req.body);
        return res.status(400).json({
          error: "Query is required and must be a string",
          received: req.body
        });
      }

      console.log("💬 User Query:", query);

      // ----------------------------
      // 1.5 Create session if needed & save user message
      // ----------------------------
      try {
        if (!sessionId) {
          // create a human readable title (optional)
          const title = `Chat - ${new Date().toISOString()}`;
          const session = await chatHistoryService.createSession(title);
          sessionId = session.id || session.session_id || session.sessionId || sessionId;
          console.log('🆕 Created session:', sessionId);
        } else {
          // Check if the provided session still exists
          const existingSessions = await chatHistoryService.getSessions();
          const sessionExists = existingSessions.some(s => s.id === sessionId);

          if (!sessionExists) {
            console.log('⚠️ Provided sessionId does not exist, creating new session');
            const title = `Chat - ${new Date().toISOString()}`;
            const session = await chatHistoryService.createSession(title);
            sessionId = session.id || session.session_id || session.sessionId;
            console.log('🆕 Created replacement session:', sessionId);
          } else {
            console.log('🔁 Using provided sessionId:', sessionId);
          }
        }

        // Save the user message into DB right away
        await chatHistoryService.saveMessage(sessionId, 'user', query);
        console.log('💾 Saved user message to DB');
      } catch (sessionErr) {
        // If DB saving fails, log but continue — we don't want to break RAG for user
        console.error('❌ Session creation / saveMessage failed:', sessionErr);
      }

      // ----------------------------
      // 2. Vector Search
      // ----------------------------
      const topK = Number(process.env.SEARCH_TOP_K) || 15;
      // Very low threshold for semantic search - embeddings can have low cosine similarity
      const threshold = 0.05; // Fixed low threshold for testing

      const searchParams = { query, topK, threshold, category };
      console.log("🔎 Searching:", searchParams);

      const semanticResults = await documentService.searchSimilar(
        query,
        topK,
        threshold,
        category
      );

      console.log(`📊 Vector search returned ${semanticResults.length} chunks`);

      if (semanticResults.length === 0) {
        const fallbackAnswer = "I couldn't find anything about that in my knowledge base. Try asking differently!";
        // Save assistant fallback reply
        try {
          if (sessionId) {
            await chatHistoryService.saveMessage(sessionId, 'assistant', fallbackAnswer);
            console.log('💾 Saved assistant fallback reply to DB');
          }
        } catch (saveErr) {
          console.error('❌ Failed to save fallback reply:', saveErr);
        }
        return res.json({
          answer: fallbackAnswer,
          sources: [],
          confidence: "low",
          sessionId
        });
      }

      // ----------------------------
      // 3. Reranking (Local → Fallback)
      // ----------------------------
      let reranked = [];

      try {
        console.log("📡 Calling LOCAL reranker:", process.env.RERANKER_SERVICE_URL);

        reranked = await rerankerService.rerank(
          query,
          semanticResults.map((c, i) => ({
            id: String(i),
            text: c.text,
            metadata: c
          })),
          Number(process.env.RERANK_TOP_K) || 3
        );

        console.log("🎯 Local reranker successful:", reranked.length);

      } catch (err) {
        console.error("❌ Local reranker error:", err.message);

        // fallback: take top K by similarity
        reranked = semanticResults
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 3)
          .map((c) => ({
            text: c.text,
            metadata: c,
            score: c.similarity
          }));

        console.warn("⚠️ Using fallback (semantic ranking)");
      }

      // ----------------------------
      // 4. Build Context (deduplicate chunks)
      // ----------------------------
      // Remove duplicate chunks (same text content)
      const seenChunks = new Set();
      const uniqueReranked = reranked.filter((d) => {
        const chunkKey = `${d.metadata.document_id}-${d.metadata.chunk_index}`;
        if (seenChunks.has(chunkKey)) {
          return false;
        }
        seenChunks.add(chunkKey);
        return true;
      });

      console.log(`📝 After deduplication: ${uniqueReranked.length} unique chunks (from ${reranked.length} total)`);

      const context = uniqueReranked
        .map((d, i) => `Source ${i + 1} (${d.metadata.filename}):\n${d.text}`)
        .join("\n\n---\n\n");

      // ----------------------------
      // 5. Ask Claude
      // ----------------------------
      const systemPrompt = `
You are **BMD Chatbot**, an advanced temple-assistant AI for Book My Darshan.

Your output must ALWAYS follow these rules:

====================================================
🏛️ 1) TEMPLE EXTRACTION MODE (VERY IMPORTANT)
====================================================
When the user asks:
• "temples in {place}"
• "list temples in {place}"
• "{place} temples"
• anything that implies grouping temples by location

YOU MUST:

1. Scan the provided document context for **all temples that match the place name**, even partially.
2. Extract **only the temple names actually present in the documents**.
3. For each temple, print:

   **Temple Name {Deity Name}**
   - If deity not found in documents:  
     "_Deity not found in documents — retrieving from internet info._"  
     Then include the deity name.
4. After listing temples, optionally add a short summary paragraph.

DO NOT:
- Add unrelated temples  
- Create a long explanation  
- Talk about history unless user asked  
- Apologize  
- Say “context does not include…” unless truly empty  

====================================================
🕉️ 2) STANDARD TEMPLE ANSWERING MODE
====================================================
When the user asks about **a specific temple**, write:

• Start with:  
  **Temple Name {Deity}**

• If the deity is missing →  
  "_Deity not found in documents — using external info._"

• Write long, rich paragraphs (premium travel guide style).

• Use bullet points when needed:
  - History  
  - Architecture  
  - Rituals  
  - Festivals  
  - Special significance  

• Prefer document context first.  
• If something is missing → fetch from internet and say so naturally.

====================================================
⛔ 3) OUT-OF-SCOPE QUESTIONS
====================================================
If the question is not about:
• temples  
• darshan  
• travel  
• spirituality  
• temple history  

Then reply:

  **"This question is outside the purpose of the Book My Darshan assistant."**

====================================================

ALWAYS follow the formatting EXACTLY.
`.trim();
      const userPrompt = `
Context:
${context}

---

User Question: ${query}

Answer clearly using ONLY the context provided above.
Do not repeat information. Be concise and organized.
If context is missing something, mention it.
      `.trim();
      console.log("🟦 READY TO CALL CLAUDE");
      console.log("🧠 Calling Claude...");

      const claudeRes = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history,
          { role: "user", content: userPrompt }
        ]
      });

      const answer = claudeRes.content?.[0]?.text || "(No response)";
      console.log("🟩 CLAUDE RESPONSE RECEIVED");
      console.log("✅ Claude response generated");

      // ----------------------------
      // 6. Save assistant reply to DB (best-effort)
      // ----------------------------
      try {
        if (sessionId) {
          await chatHistoryService.saveMessage(sessionId, 'assistant', answer);
          console.log('💾 Saved assistant message to DB');
        }
      } catch (saveErr) {
        console.error('❌ Failed to save assistant message:', saveErr);
      }

      // ----------------------------
      // 7. Return Final Response (include sessionId)
      // ----------------------------
      res.json({
        answer,
        sources: uniqueReranked.map(r => ({
          filename: r.metadata.filename,
          similarity: r.metadata.similarity,
          rerankScore: r.score
        })),
        confidence: semanticResults.length > 3 ? "high" : "medium",
        sessionId
      });

    } catch (error) {
      console.error("❌ ChatController Error:", error);
      res.status(500).json({
        error: "Chat processing failed",
        message: error.message
      });
    }
  }

  health(req, res) {
    res.json({ ok: true, service: "BMD Chat API" });
  }
}

export default new ChatController();
