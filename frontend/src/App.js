import React, { useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResultsList from './components/ResultsList';
import PreviewPane from './components/PreviewPane';
import { useTheme } from './hooks/useTheme';
import { useUIState } from './hooks/useUIState';
import './index.css';
import './styles/glassmorphism.css';

function App() {
  const { isDarkMode } = useTheme();
  const {
    coPilotActive,
    activeTab,
    collapsedSections,
    searchQuery,
    toggleCoPilot,
    switchTab,
    toggleSection,
    handleSearch,
    setSearchQuery
  } = useUIState();

  useEffect(() => {
    // Initialize Lucide icons when component mounts
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const handleResultSelect = (result) => {
    console.log('Selected result:', result);
    // Here you would handle result selection logic
  };

  return (
    <div className={`h-screen bg-white dark:bg-gradient-to-br dark:from-electric-900 dark:via-electric-800 dark:to-cyber-900 overflow-hidden font-inter cyber-grid transition-all duration-500 ${isDarkMode ? 'dark' : ''}`}>
      {/* Global Header Bar */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Layout Container */}
      <div className="flex h-[calc(100vh-60px)] w-full">
        {/* Left Sidebar */}
        <Sidebar 
          coPilotActive={coPilotActive}
          onToggleCoPilot={toggleCoPilot}
          collapsedSections={collapsedSections}
          onToggleSection={toggleSection}
        />

        {/* Central Results Panel */}
        <ResultsList 
          query={searchQuery}
          onResultSelect={handleResultSelect}
        />

        {/* Right Preview Pane */}
        <PreviewPane 
          activeTab={activeTab}
          onTabSwitch={switchTab}
        />
      </div>
    </div>
  );
}

export default App;
