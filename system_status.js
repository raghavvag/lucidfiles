#!/usr/bin/env node

/**
 * LucidFiles System Status & Enhanced Startup
 * Comprehensive visual status for all three services
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const SERVICES = {
  worker: { url: 'http://localhost:8000', name: 'Semantic Worker', emoji: '🤖' },
  backend: { url: 'http://localhost:3001', name: 'Backend API', emoji: '🌐' },
  frontend: { url: 'http://localhost:3000', name: 'Frontend UI', emoji: '💻' }
};

function printSystemBanner() {
  console.log('\n' + '='.repeat(80));
  console.log('🌟 LUCIDFILES - COMPREHENSIVE SYSTEM STATUS');
  console.log('='.repeat(80));
  console.log('🎯 Semantic Search Engine with Enhanced Visual Logging');
  console.log('⚡ High-Performance Caching (20-40x faster repeated searches)');
  console.log('👀 Real-time File Monitoring & Auto-indexing');
  console.log('🎨 Judge-Ready Demo with Visual Feedback');
  console.log('='.repeat(80) + '\n');
}

async function checkServiceStatus(service, config) {
  try {
    const response = await axios.get(`${config.url}/health`, { timeout: 2000 });
    console.log(`✅ ${config.emoji} ${config.name} - RUNNING (${config.url})`);
    return true;
  } catch (error) {
    console.log(`❌ ${config.emoji} ${config.name} - DOWN (${config.url})`);
    return false;
  }
}

async function systemStatus() {
  printSystemBanner();
  
  console.log('🔍 Checking system status...\n');
  
  const statuses = {};
  for (const [service, config] of Object.entries(SERVICES)) {
    statuses[service] = await checkServiceStatus(service, config);
  }
  
  console.log('\n' + '─'.repeat(60));
  
  const runningCount = Object.values(statuses).filter(Boolean).length;
  const totalCount = Object.keys(statuses).length;
  
  if (runningCount === totalCount) {
    console.log('🎉 ALL SERVICES RUNNING - System is fully operational!');
  } else if (runningCount > 0) {
    console.log(`⚠️  PARTIAL SYSTEM - ${runningCount}/${totalCount} services running`);
  } else {
    console.log('❌ SYSTEM DOWN - No services detected');
  }
  
  console.log('\n📋 Service Features:');
  console.log('   🤖 Worker: Embedding cache, semantic search, document parsing');
  console.log('   🌐 Backend: File watching, API routing, OpenAI integration');
  console.log('   💻 Frontend: Electron UI, real-time updates, search interface');
  
  console.log('\n🚀 To start missing services:');
  if (!statuses.worker) console.log('   Worker:  cd worker && python app.py');
  if (!statuses.backend) console.log('   Backend: cd backend && node start_enhanced.js');
  if (!statuses.frontend) console.log('   Frontend: cd frontend && npm start');
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  return statuses;
}

async function startAllServices() {
  printSystemBanner();
  
  console.log('🚀 Starting all LucidFiles services with enhanced logging...\n');
  
  // Start worker
  console.log('🤖 Starting Semantic Worker...');
  const workerPath = path.join(__dirname, '..', 'worker');
  const worker = spawn('python', ['app.py'], {
    cwd: workerPath,
    stdio: 'inherit'
  });
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Start backend
  console.log('🌐 Starting Backend API...');
  const backendPath = path.join(__dirname, 'start_enhanced.js');
  const backend = spawn('node', [backendPath], {
    stdio: 'inherit'
  });
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Start frontend
  console.log('💻 Starting Frontend UI...');
  const frontendPath = path.join(__dirname, '..', 'frontend');
  const frontend = spawn('npm', ['start'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });
  
  console.log('\n🎉 All services starting up with enhanced visual logging!');
  console.log('📊 Monitor the consoles for real-time operation feedback.');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    worker.kill('SIGTERM');
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--start-all')) {
    await startAllServices();
  } else {
    await systemStatus();
  }
}

if (require.main === module) {
  main();
}

module.exports = { systemStatus, startAllServices };
