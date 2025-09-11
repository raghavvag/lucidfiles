import React, { useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResultsList from './components/ResultsList_New';
import PreviewPane from './components/PreviewPane_New';
import { useTheme } from './hooks/useTheme';
import { useUIState } from './hooks/useUIState';
import { useSearch } from './hooks/useSearch';
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
  
  const { results, isSearching, search, clearResults } = useSearch();

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      // Clear results when search is empty
      clearResults();
      return;
    }
    
    if (searchQuery.trim().length < 2) {
      // Don't search for very short queries
      return;
    }

    const timeoutId = setTimeout(() => {
      search(searchQuery.trim());
    }, 300); // Reduced debounce time for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [searchQuery, search, clearResults]);

  const handleResultSelect = (result) => {
    console.log('Selected result:', result);
    // Switch to preview tab when a result is selected
    switchTab('preview');
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
          results={results}
          query={searchQuery}
          isSearching={isSearching}
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
