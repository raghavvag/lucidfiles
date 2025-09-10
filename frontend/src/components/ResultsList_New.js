import React, { useState, useEffect } from 'react';
import { FileCode, FileText, Database, Filter, Eye, Download, Share, Trash } from 'lucide-react';

const ResultsList = ({ results = [], query, onResultSelect }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const getFileIcon = (type) => {
    switch (type) {
      case 'code':
        return FileCode;
      case 'document':
        return FileText;
      case 'data':
        return Database;
      default:
        return FileCode;
    }
  };

  const getFileColor = (type) => {
    switch (type) {
      case 'code':
        return 'from-neon-500 to-neon-600';
      case 'document':
        return 'from-cyber-500 to-cyber-600';
      case 'data':
        return 'from-electric-600 to-electric-700';
      default:
        return 'from-neon-500 to-neon-600';
    }
  };

  const getMatchColor = (matchPercentage) => {
    if (matchPercentage >= 95) return 'bg-neon-500/20 text-neon-700 dark:text-neon-400';
    if (matchPercentage >= 90) return 'bg-cyber-500/20 text-cyber-700 dark:text-cyber-400';
    return 'bg-electric-500/20 text-electric-700 dark:text-electric-400';
  };

  const showContextMenu = (cardId) => {
    setHoveredCard(cardId);
  };

  const hideContextMenu = () => {
    setHoveredCard(null);
  };

  const sampleResults = [
    {
      id: 1,
      filename: 'neural_network.py',
      type: 'code',
      match: 98,
      description: 'Implementation of a deep neural network with backpropagation and gradient descent optimization. Includes batch normalization and dropout layers for improved training stability.'
    },
    {
      id: 2,
      filename: 'machine_learning_guide.md',
      type: 'document',
      match: 94,
      description: 'Comprehensive guide covering supervised learning, unsupervised learning, and reinforcement learning algorithms. Includes practical examples and implementation tips.'
    },
    {
      id: 3,
      filename: 'dataset_analysis.ipynb',
      type: 'data',
      match: 87,
      description: 'Jupyter notebook containing exploratory data analysis with statistical insights and data visualization. Features correlation analysis and feature engineering techniques.'
    }
  ];

  const displayResults = results.length > 0 ? results : sampleResults;

  return (
    <main className="w-[720px] glass border-r border-white/10 divider-glow flex flex-col">
      {/* Search Results Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Search Results</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {displayResults.length} files found
            </span>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayResults.map((result) => {
          const IconComponent = getFileIcon(result.type);
          return (
            <div 
              key={result.id}
              className="h-40 glass rounded-xl p-4 hover:bg-white/20 transition-colors duration-300 cursor-pointer relative group neon-border" 
              onMouseEnter={() => showContextMenu(result.id)} 
              onMouseLeave={hideContextMenu}
              onClick={() => onResultSelect && onResultSelect(result)}
            >
              <div className="flex items-start space-x-4 h-full">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getFileColor(result.type)} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {result.filename}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(result.match)} animate-pulse`}>
                      {result.match}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {result.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 rounded-lg bg-neon-500/20 text-neon-700 dark:text-neon-400 text-xs font-medium hover:bg-neon-500/30 transition-all duration-300 hover:animate-pulse">
                      Open
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-cyber-500/20 text-cyber-700 dark:text-cyber-400 text-xs font-medium hover:bg-cyber-500/30 transition-all duration-300 hover:animate-pulse">
                      Summarize
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-electric-500/20 text-electric-700 dark:text-electric-400 text-xs font-medium hover:bg-electric-500/30 transition-all duration-300 hover:animate-pulse">
                      Pin
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Context Menu */}
              <div className={`context-menu absolute top-4 right-4 w-32 h-32 rounded-full glass neon-border flex items-center justify-center ${
                hoveredCard === result.id ? 'active' : ''
              }`}>
                <div className="grid grid-cols-2 gap-2">
                  <button className="w-8 h-8 rounded-full bg-neon-500/20 flex items-center justify-center hover:bg-neon-500/40 transition-all duration-300 hover:animate-pulse">
                    <Eye className="w-4 h-4 text-neon-600 dark:text-neon-400" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-cyber-500/20 flex items-center justify-center hover:bg-cyber-500/40 transition-all duration-300 hover:animate-pulse">
                    <Download className="w-4 h-4 text-cyber-600 dark:text-cyber-400" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-electric-500/20 flex items-center justify-center hover:bg-electric-500/40 transition-all duration-300 hover:animate-pulse">
                    <Share className="w-4 h-4 text-electric-600 dark:text-electric-400" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-all duration-300 hover:animate-pulse">
                    <Trash className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default ResultsList;
