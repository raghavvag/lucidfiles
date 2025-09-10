import React from 'react';
import { Folder, Code, FileText, Image, Brain, ChevronDown } from 'lucide-react';

const Sidebar = ({ 
  coPilotActive, 
  onToggleCoPilot, 
  collapsedSections, 
  onToggleSection 
}) => {

  return (
    <aside className="w-70 glass-dark border-r border-white/10 divider-glow flex flex-col">
      {/* Recent Projects Section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Projects</h3>
          <button 
            className="p-1 rounded hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300" 
            onClick={() => onToggleSection('projects')}
          >
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 dark:text-gray-300 transition-transform duration-300 ${
                collapsedSections.projects ? '-rotate-90' : ''
              }`} 
            />
          </button>
        </div>
        
        {!collapsedSections.projects && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-500 to-neon-600 flex items-center justify-center group-hover:animate-pulse-glow shadow-lg">
                <Folder className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">AI Research</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">142 files</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-cyber-500 to-cyber-600 flex items-center justify-center group-hover:animate-pulse-glow shadow-lg">
                <Code className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Web Projects</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">89 files</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Memory Lane Section */}
      <div className="p-4 border-b border-white/10 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Memory Lane</h3>
          <button 
            className="p-1 rounded hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300" 
            onClick={() => onToggleSection('memory')}
          >
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 dark:text-gray-300 transition-transform duration-300 ${
                collapsedSections.memory ? '-rotate-90' : ''
              }`} 
            />
          </button>
        </div>
        
        {!collapsedSections.memory && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 group">
              <div className="w-6 h-6 rounded bg-neon-500 flex items-center justify-center mt-1 group-hover:animate-pulse shadow-sm">
                <FileText className="w-3 h-3 text-white drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-white">research_notes.md</p>
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">AI summarizes key ML concepts and recent breakthroughs...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 min ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 group">
              <div className="w-6 h-6 rounded bg-cyber-500 flex items-center justify-center mt-1 group-hover:animate-pulse shadow-sm">
                <Image className="w-3 h-3 text-white drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-white">architecture.png</p>
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">System diagram showing microservices architecture...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">15 min ago</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Co-Pilot Mode Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-neon-500 to-cyber-500 flex items-center justify-center shadow-lg ${
              coPilotActive ? 'animate-pulse-glow' : ''
            }`}>
              <Brain className="w-3 h-3 text-white drop-shadow-sm" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Co-Pilot Mode</span>
          </div>
          <button 
            className="relative w-12 h-6 neumorphic-dark rounded-full transition-all duration-300" 
            onClick={onToggleCoPilot}
          >
            <div 
              className={`absolute top-1 left-1 w-4 h-4 bg-gradient-to-r from-neon-500 to-cyber-500 rounded-full shadow-lg transition-transform duration-300 ${
                coPilotActive ? 'transform translate-x-6 animate-pulse-glow' : ''
              }`} 
            />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
