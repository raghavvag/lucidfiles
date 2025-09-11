#!/usr/bin/env node

/**
 * Enhanced Startup Script for LucidFiles Backend
 * Shows comprehensive visual logging and system status
 */

const { spawn } = require('child_process');
const path = require('path');

function printStartupBanner() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 LUCIDFILES BACKEND - ENHANCED STARTUP');
  console.log('='.repeat(60));
  console.log('🎯 Performance: Caching enabled for 20-40x speedup');
  console.log('👀 Monitoring: Real-time file watching with chokidar');
  console.log('🎨 Logging: Enhanced visual feedback with emojis');
  console.log('🔍 Search: Semantic search with OpenAI integration');
  console.log('='.repeat(60) + '\n');
}

function startServer() {
  printStartupBanner();
  
  console.log('🔄 Starting backend server with enhanced logging...');
  
  const serverPath = path.join(__dirname, 'src', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  server.on('error', (error) => {
    console.error('❌ 🚀 Failed to start server:', error.message);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ 🚀 Server exited with code ${code}`);
    } else {
      console.log('✅ 🚀 Server shut down gracefully');
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Gracefully shutting down backend server...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down backend server...');
    server.kill('SIGTERM');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
