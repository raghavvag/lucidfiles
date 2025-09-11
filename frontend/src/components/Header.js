import React from 'react';
import { Search, Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Header = ({ searchQuery, onSearchChange }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSearchInput = (e) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Add visual feedback for search
    if (value.length > 0) {
      if (isDarkMode) {
        e.target.style.boxShadow = '0 0 20px rgba(217, 70, 239, 0.4)';
        e.target.style.borderColor = 'rgba(217, 70, 239, 0.6)';
      } else {
        e.target.style.boxShadow = '0 0 20px rgba(14, 165, 233, 0.4)';
        e.target.style.borderColor = 'rgba(14, 165, 233, 0.6)';
      }
    } else {
      e.target.style.boxShadow = '';
      e.target.style.borderColor = '';
    }
  };

  return (
    <header className="h-15 w-full glass border-b border-white/20 flex items-center justify-between px-6 relative z-50">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Semantic File Explorer 2.0
      </h1>
      
      {/* Central Search Input */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search files semantically... (e.g., 'machine learning algorithms', 'authentication code')" 
            value={searchQuery}
            onChange={handleSearchInput}
            className="w-[600px] h-12 px-6 pr-12 rounded-full glass neon-border text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-500/50 dark:focus:ring-cyber-500/50 transition-all duration-300 animate-neon-pulse"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>
      
      {/* Theme Toggle & Settings */}
      <div className="flex items-center space-x-2">
        <button 
          className="p-2 rounded-lg glass hover:bg-white/20 transition-all duration-300 neon-border" 
          onClick={toggleTheme}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400 transition-all duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600 transition-all duration-300" />
          )}
        </button>
        <button className="p-2 rounded-lg glass hover:bg-white/20 transition-all duration-300">
          <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
