const chokidar = require('chokidar');
const worker = require('../lib/workerClient');
const db = require('../db');

const watchers = new Map();

function startWatcher(dirPath) {
  if (watchers.has(dirPath)) return;
  const watcher = chokidar.watch(dirPath, { persistent: true, ignoreInitial: true, depth: 99 });
  watcher
    .on('add', async path => {
      console.log('📄 ➕ New file detected:', path);
      try {
        const res = await worker.indexFile(path);
        console.log('✅ 🔍 File indexed successfully:', path.split(/[\\/]/).pop());
        // optional: update DB using res info
        db.upsertFile({ path, dir_id: null, checksum: res.data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
      } catch (e) { 
        console.error('❌ 🔍 File indexing failed:', e.message); 
      }
    })
    .on('change', async path => {
      console.log('📄 ✏️  File changed:', path);
      try {
        const res = await worker.reindexFile(path);
        console.log('✅ 🔄 File reindexed successfully:', path.split(/[\\/]/).pop());
        db.upsertFile({ path, dir_id: null, checksum: res.data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
      } catch (e) { 
        console.error('❌ 🔄 File reindexing failed:', e.message); 
      }
    })
    .on('unlink', async path => {
      console.log('📄 🗑️  File deleted:', path);
      try {
        await worker.removeFile(path);
        console.log('✅ 🗑️  File removed from index:', path.split(/[\\/]/).pop());
        db.removeFile(path);
      } catch (e) { 
        console.error('❌ 🗑️  File removal failed:', e.message); 
      }
    });

  watchers.set(dirPath, watcher);
  console.log('🎯 👀 File watcher activated for:', dirPath);
}

function stopWatcher(dirPath) {
  const w = watchers.get(dirPath);
  if (w) {
    w.close();
    watchers.delete(dirPath);
  }
}

function status() {
  return Array.from(watchers.keys());
}

module.exports = { startWatcher, stopWatcher, status };
