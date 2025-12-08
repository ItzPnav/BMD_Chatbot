import React, { useState } from 'react';
import { UploadFiles } from './UploadFiles';
import ManageFiles from "./ManageFiles.jsx";
import { GenerateEmbeddings } from './GenerateEmbeddings';
import { ChatManagement } from './ChatManagement';
import { Analytics } from './Analytics';
import styles from './AdminDashboard.module.css';

/**
 * Admin Dashboard main component
 */
export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('upload');

  const sections = [
    { id: 'upload', label: 'Upload Files', component: UploadFiles },
    { id: 'manage', label: 'Manage Files', component: ManageFiles },
    { id: 'embeddings', label: 'Generate Embeddings', component: GenerateEmbeddings },
    { id: 'chats', label: 'Chat Management', component: ChatManagement },
    { id: 'analytics', label: 'Analytics', component: Analytics }
  ];

  const ActiveComponent = sections.find((s) => s.id === activeSection)?.component;

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
        <nav className={styles.nav}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`${styles.navItem} ${
                activeSection === section.id ? styles.active : ''
              }`}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
      <div className={styles.content}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

