// frontend/src/components/AdminDashboard/ManageFiles.jsx
import { adminAPI } from "../../services/api";
import React, { useEffect, useState } from "react";
import { Table } from "../ui/Table.jsx";
import styles from "./AdminDashboard.module.css";
import { TrashIcon, RefreshIcon } from "../../assets/icons";

export default function ManageFiles() {
  const [files, setFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // LOAD FILE LIST
  const loadFiles = async () => {
    try {
      const docs = await adminAPI.getFiles();

      const updated = docs.map((f) => ({
        ...f,
        chunk_count: f.chunk_count || 0,
        processed: Number(f.chunk_count || 0) > 0,
      }));

      setFiles(updated);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  };


  useEffect(() => {
    loadFiles();
  }, []);

  // PAGINATION
  const paginatedFiles = files
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((file, i) => ({
      ...file,
      serial: (currentPage - 1) * itemsPerPage + i + 1,
    }));

  // DELETE FILE
  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteFile(id);
      loadFiles();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // PROCESS FILE
  const handleProcess = async (id) => {
    try {
      await adminAPI.generateEmbeddings([id]); // expects array
      // Wait a bit for DB to update, then refresh
      setTimeout(() => {
        loadFiles();
      }, 500);
    } catch (err) {
      console.error("Process error:", err);
      // Still refresh even on error
      loadFiles();
    }
  };


  // TABLE COLUMNS
  const columns = [
    { key: "serial", label: "ID" },
    { key: "filename", label: "Filename" },
    { key: "category", label: "Category" },
    {
      key: "size",
      label: "Size",
      render: (value) => {
        if (!value || value === 0) return <span>-</span>;
        const sizeInKB = (value / 1024).toFixed(1);
        const sizeInMB = (value / (1024 * 1024)).toFixed(1);
        return <span>{value < 1024 * 1024 ? `${sizeInKB} KB` : `${sizeInMB} MB`}</span>;
      },
    },
    {
      key: "chunk_count",
      label: "Chunks",
      render: (value) => (
        <span style={{ textAlign: 'center', display: 'block', width: '100%' }}>
          {value || 0}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const isProcessed = Number(row.chunk_count || 0) > 0;
        return (
          <span
            className={
              isProcessed ? styles.processed : styles.notProcessed
            }
          >
            {isProcessed ? "Processed ✅" : "Not processed"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, row) => (
        <div className={styles.actionBtns}>
          {/* Delete Icon */}
          <button
            onClick={() => handleDelete(row.id)}
            className={styles.iconButton}
            title="Delete"
          >
            <TrashIcon />
          </button>

          {/* Reprocess Icon */}
          <button
            onClick={() => handleProcess(row.id)}
            className={styles.iconButton}
            title="Reprocess"
          >
            <RefreshIcon />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <h2>Manage Files</h2>
      <Table data={paginatedFiles} columns={columns} />

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          ←
        </button>

        <span>
          Page {currentPage} / {Math.ceil(files.length / itemsPerPage)}
        </span>

        <button
          disabled={currentPage * itemsPerPage >= files.length}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
