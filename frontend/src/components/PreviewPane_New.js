import React from 'react';
import { Brain, Hash } from 'lucide-react';

const PreviewPane = ({ activeTab, onTabSwitch, selectedFile }) => {

  const handleAskAI = () => {
    // Placeholder for AI functionality
    console.log('AI question submitted');
  };

  return (
    <aside className="w-[440px] glass flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        <button 
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 tab-button ${
            activeTab === 'preview' ? 'active' : ''
          }`}
          onClick={() => onTabSwitch('preview')}
        >
          Preview
        </button>
        <button 
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 tab-button ${
            activeTab === 'insight' ? 'active' : ''
          }`}
          onClick={() => onTabSwitch('insight')}
        >
          AI Insight
        </button>
      </div>

      {/* Preview Tab Content */}
      {activeTab === 'preview' && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="glass rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">neural_network.py</h3>
              <div className="font-mono text-sm space-y-2">
                <div className="text-gray-600 dark:text-gray-300">
                  <span className="text-blue-600 dark:text-blue-400">import</span> numpy <span className="text-blue-600 dark:text-blue-400">as</span> np<br/>
                  <span className="text-blue-600 dark:text-blue-400">import</span> tensorflow <span className="text-blue-600 dark:text-blue-400">as</span> tf
                </div>
                <div className="bg-yellow-200/20 dark:bg-yellow-500/20 p-2 rounded border-l-4 border-yellow-500">
                  <span className="text-blue-600 dark:text-blue-400">class</span> <span className="text-green-600 dark:text-green-400">NeuralNetwork</span>:
                </div>
                <div className="text-gray-600 dark:text-gray-300 ml-4">
                  <span className="text-blue-600 dark:text-blue-400">def</span> <span className="text-green-600 dark:text-green-400">__init__</span>(self, layers):
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-white">Quick Navigation</h4>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-sm text-gray-600 dark:text-gray-300">
                  <Hash className="w-3 h-3 inline mr-2" />
                  Class Definition (Line 15)
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-sm text-gray-600 dark:text-gray-300">
                  <Hash className="w-3 h-3 inline mr-2" />
                  Forward Pass (Line 42)
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-sm text-gray-600 dark:text-gray-300">
                  <Hash className="w-3 h-3 inline mr-2" />
                  Backpropagation (Line 78)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insight Tab Content */}
      {activeTab === 'insight' && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="glass rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-neon-500 dark:text-cyber-400 animate-pulse" />
                AI Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                This neural network implementation features a modular architecture with configurable layers, 
                batch normalization, and dropout regularization. The code demonstrates best practices for 
                gradient descent optimization and includes comprehensive error handling.
              </p>
            </div>

            <div className="glass rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Key Concepts</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-neon-500 animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Backpropagation Algorithm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Gradient Descent Optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-electric-500 animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Batch Normalization</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-white mb-3">Ask AI</h4>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Ask about this file..." 
                  className="w-full px-3 py-2 rounded-lg glass neon-border text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-500/50 dark:focus:ring-cyber-500/50 animate-neon-pulse"
                />
                <button 
                  onClick={handleAskAI}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-neon-500 to-cyber-500 text-white text-sm font-medium hover:from-neon-600 hover:to-cyber-600 transition-all duration-300 animate-pulse-glow"
                >
                  Ask AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PreviewPane;
