// backend/src/controllers/documentController.js

import fs from 'fs';
import path from 'path';
import documentService from '../services/documentService.js';
import { extractTextFromPDF, isValidPDF } from '../utils/pdfUtils.js';

const dataDir = path.join(process.cwd(), 'data', 'documents');

class DocumentController {
  async uploadDocuments(req, res) {
    try {
      const category = req.body.category || 'General';
      const uploadedFiles = [
        ...(req.files?.file || []),
        ...(req.files?.files || [])
      ];

      if (!uploadedFiles.length) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      const categoryPath = path.join(dataDir, category);
      if (!fs.existsSync(categoryPath)) fs.mkdirSync(categoryPath, { recursive: true });

      const results = [];

      for (const file of uploadedFiles) {
        const timestamp = Date.now();
        const safeName = `${timestamp}-${file.originalname}`;
        const filePath = path.join(categoryPath, safeName);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        let content = '';
        let mimeType = file.mimetype || 'application/octet-stream';

        // Handle PDF files
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
          try {
            // Validate PDF format
            if (!isValidPDF(file.buffer)) {
              throw new Error('Invalid PDF file format');
            }

            // Extract text from PDF
            content = await extractTextFromPDF(filePath);
            mimeType = 'application/pdf';
          } catch (pdfError) {
            console.error(`PDF processing error for ${file.originalname}:`, pdfError);
            // Clean up the saved file on error
            try {
              fs.unlinkSync(filePath);
            } catch (cleanupError) {
              console.error('Error cleaning up failed PDF upload:', cleanupError);
            }
            throw new Error(`Failed to process PDF ${file.originalname}: ${pdfError.message}`);
          }
        } else {
          // Handle text files (existing logic)
          content = file.buffer.toString("utf-8");
        }

        // Create document in database
        const doc = await documentService.createDocument(
          safeName,
          mimeType,
          content,
          category
        );

        results.push({ id: doc.id, filename: safeName, category, processed: false });
      }

      return res.json({ success: true, message: "Files uploaded successfully (unprocessed)", files: results });
    } catch (error) {
      console.error("❌ uploadDocuments error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllDocuments(req, res) {
    try {
      const docs = await documentService.getAllDocuments();
      return res.json({ success: true, data: docs });
    } catch (error) {
      console.error("❌ getAllDocuments error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDocumentStatus(req, res) {
    try {
      const { id } = req.params;
      const count = await documentService.getDocumentEmbeddingCount(id);
      return res.json({ success: true, processed: Number(count) > 0, chunks: Number(count) });
    } catch (error) {
      console.error("❌ getDocumentStatus error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      await documentService.deleteDocument(id);
      return res.json({ success: true, message: "Document deleted" });
    } catch (error) {
      console.error("❌ deleteDocument error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchDocuments(req, res) {
    try {
      const query = req.query.query || "";
      const topK = Number(req.query.topK) || 5;
      const results = await documentService.searchDocumentsByQuery(query, topK);
      return res.json({ success: true, count: results.length, data: results });
    } catch (error) {
      console.error("❌ searchDocuments error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async processDocument(req, res) {
    try {
      const { id } = req.params;
      const chunkCount = await documentService.processDocumentById(id);
      return res.json({ success: true, message: "Document processed successfully", chunks: chunkCount });
    } catch (error) {
      console.error("❌ processDocument error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new DocumentController();
