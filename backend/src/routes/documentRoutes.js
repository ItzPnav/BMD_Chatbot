// backend/src/routes/documentRoutes.js

import express from 'express';
import multer from 'multer';
import documentController from '../controllers/documentController.js';

const router = express.Router();

// Multer in-memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/plain" || file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only .txt and .pdf files allowed"));
  }
});

// Accept BOTH: "file" and "files"
const uploadHandler = upload.fields([
  { name: "file", maxCount: 20 },
  { name: "files", maxCount: 20 }
]);

// UPLOAD
router.post('/upload', uploadHandler, (req, res) => documentController.uploadDocuments(req, res));

// PROCESS (EMBEDDINGS)
router.post('/process/:id', (req, res) => documentController.processDocument(req, res));

// STATUS: returns { processed: boolean, chunks: number }
router.get('/:id/status', (req, res) => documentController.getDocumentStatus(req, res));

// LIST ALL
router.get('/', (req, res) => documentController.getAllDocuments(req, res));

// DELETE (keep after more specific routes)
router.delete('/:id', (req, res) => documentController.deleteDocument(req, res));

// SEARCH
router.get('/search', (req, res) => documentController.searchDocuments(req, res));

export default router;
