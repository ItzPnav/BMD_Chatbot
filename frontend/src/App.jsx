import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FloatingChatButton } from './components/FloatingChatButton/FloatingChatButton';
import { ChatPopup } from './components/ChatPopup/ChatPopup';
import { FullscreenLayout } from './components/FullscreenLayout/FullscreenLayout';
import { AdminDashboard } from './components/AdminDashboard/AdminDashboard';
import { getUIState, saveUIState } from './services/localStorageKeys';
import './App.css';

/**
 * Main App component with routing and chat state management
 */
function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Load UI state from localStorage on mount
  useEffect(() => {
    const savedState = getUIState();
    setChatOpen(savedState.open || false);
    setFullscreen(savedState.fullscreen || false);
  }, []);

  // Save UI state to localStorage when it changes
  useEffect(() => {
    saveUIState({ open: chatOpen, fullscreen });
  }, [chatOpen, fullscreen]);

  const handleOpenChat = () => {
    setChatOpen(true);
    setFullscreen(false);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setFullscreen(false);
    setCurrentChatId(null);
  };

  const handleMaximize = () => {
    setFullscreen(true);
    setChatOpen(false);
  };

  const handleChatChange = (chatId) => {
    setCurrentChatId(chatId);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="*"
            element={
              <>
                {!fullscreen && !chatOpen && (
                  <FloatingChatButton onClick={handleOpenChat} />
                )}
                {!fullscreen && chatOpen && (
                  <ChatPopup
                    isOpen={chatOpen}
                    onClose={handleCloseChat}
                    onMaximize={handleMaximize}
                    currentChatId={currentChatId}
                    onChatChange={handleChatChange}
                  />
                )}
                {fullscreen && (
                  <FullscreenLayout
                    currentChatId={currentChatId}
                    onChatChange={handleChatChange}
                    onClose={() => {
                      setFullscreen(false);
                      setChatOpen(true);
                    }}
                  />
                )}
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
