import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../ui/Button';
import styles from './AdminDashboard.module.css';

export const UploadFiles = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = [
    'Terms',
    'FAQs',
    'Manuals',
    'History',
    'Packages',
    'Other'
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (!files.length) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }
    if (!category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const results = [];

      for (const file of files) {
        const response = await adminAPI.uploadFile(file, category);
        results.push(response);
      }

      setMessage({
        type: 'success',
        text: `${files.length} file(s) uploaded successfully!`
      });

      setFiles([]);
      setCategory('');
      document.getElementById('file-input').value = '';

      onUploadSuccess?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upload files'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Upload Files</h2>

      <div className={styles.uploadContainer}>
        <div className={styles.uploadNote}>
          <strong>Note:</strong> Upload text (.txt) or PDF (.pdf) files. Files will be saved to:{' '}
          <code className={styles.pathCode}>
            {'data/documents/<category>/'}
          </code>
        </div>

        <div className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="file-input" className={styles.label}>
              Select Files
            </label>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileChange}
              className={styles.fileInput}
              accept=".txt,.pdf,text/plain,application/pdf"
            />

            {files.length > 0 && (
              <div className={styles.fileInfo}>
                <p><strong>Selected Files:</strong></p>
                <ul>
                  {files.map(f => (
                    <li key={f.name}>{f.name} ({(f.size / 1024).toFixed(2)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className={styles.uploadButton}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>

          {message.text && (
            <div
              className={`${styles.message} ${
                message.type === 'success' ? styles.success : styles.error
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
