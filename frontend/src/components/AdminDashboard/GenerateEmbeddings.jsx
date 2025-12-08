import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Table } from '../ui/Table';
import styles from './AdminDashboard.module.css';

/**
 * Generate Embeddings section component
 */
export const GenerateEmbeddings = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getFiles();
      const unprocessed = data.filter((f) => !f.processed);
      setFiles(unprocessed);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedFiles.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      await adminAPI.generateEmbeddings(Array.from(selectedFiles));
      setMessage({
        type: 'success',
        text: `Embeddings generation started for ${selectedFiles.size} file(s)`
      });
      setSelectedFiles(new Set());
      setTimeout(() => {
        loadFiles();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate embeddings'
      });
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      key: 'checkbox',
      label: '',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedFiles.has(row.id)}
          onChange={() => handleToggleSelect(row.id)}
        />
      )
    },
    {
      key: 'filename',
      label: 'FILENAME'
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (value) => value || 'N/A'
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (value) => (
        <span className={styles.notProcessed}>
          {value === 'processed' ? 'Processed ✅' : 'Not processed'}
        </span>
      )
    }
  ];

  const allProcessed = files.length === 0 && !loading;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Generate Embeddings</h2>
      {allProcessed ? (
        <div className={styles.allProcessed}>
          <p className={styles.successMessage}>
            All uploaded files have been processed! No pending files.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.embeddingsInfo}>
            <p>
              {files.length > 0
                ? 'Some files have been processed. Check below table for incomplete embeddings generation.'
                : 'No unprocessed files found.'}
            </p>
          </div>
          {files.length > 0 && (
            <>
              <div className={styles.embeddingsActions}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>Select all</span>
                </label>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={selectedFiles.size === 0 || generating}
                >
                  {generating
                    ? 'Generating...'
                    : `Generate embeddings for ${selectedFiles.size} selected file(s)`}
                </Button>
              </div>
              <Table columns={columns} data={files} loading={loading} />
              {message.text && (
                <div
                  className={`${styles.message} ${
                    message.type === 'success' ? styles.success : styles.error
                  }`}
                >
                  {message.text}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

