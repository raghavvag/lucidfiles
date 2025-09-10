const chokidar = require('chokidar');
const worker = require('../lib/workerClient');
const db = require('../db');

const watchers = new Map();

function startWatcher(dirPath) {
  if (watchers.has(dirPath)) return;
  const watcher = chokidar.watch(dirPath, { persistent: true, ignoreInitial: true, depth: 99 });
  watcher
    .on('add', async path => {
      console.log('File added:', path);
      try {
        const res = await worker.indexFile(path);
        // optional: update DB using res info
        db.upsertFile({ path, dir_id: null, checksum: res.data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
      } catch (e) { console.error('index-file error', e.message); }
    })
    .on('change', async path => {
      console.log('File changed:', path);
      try {
        const res = await worker.reindexFile(path);
        db.upsertFile({ path, dir_id: null, checksum: res.data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
      } catch (e) { console.error('reindex-file error', e.message); }
    })
    .on('unlink', async path => {
      console.log('File removed:', path);
      try {
        await worker.removeFile(path);
        db.removeFile(path);
      } catch (e) { console.error('remove-file error', e.message); }
    });

  watchers.set(dirPath, watcher);
  console.log('Started watcher for', dirPath);
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
