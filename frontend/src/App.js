import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResultsList from './components/ResultsList_New';
import PreviewPane from './components/PreviewPane_New';
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
    setSearchQuery
  } = useUIState();

  const handleResultSelect = (result) => {
    console.log('Selected result:', result);
    // Here you would handle result selection logic
  };

  return (
    <div className={`h-screen overflow-hidden font-inter transition-all duration-500 ${isDarkMode ? 'dark cyber-grid' : ''}`}>
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
