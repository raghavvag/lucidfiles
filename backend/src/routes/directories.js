const express = require('express');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const worker = require('../lib/workerClient');
const watcher = require('../watcher/watcherManager');

router.post('/set-directory', async (req, res) => {
  const { path } = req.body;
  
  if (!path || !fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
    return res.status(400).json({ error: 'Invalid directory path' });
  }
  const dir = db.addDirectory(path);
  try {
    // initial full index (blocking) - worker handles chunking
    await worker.indexDirectory(path);
    // after initial index, start watching only new changes
    watcher.startWatcher(path);
    res.json({ ok: true, directory: dir });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Indexing failed', details: err.message });
  }
});

router.get('/directories', (req, res) => {
  res.json(db.listDirectories());
});

router.delete('/remove-directory', (req, res) => {
  const { path } = req.body;
  watcher.stopWatcher(path);
  db.removeDirectory(path);
  res.json({ ok: true });
});

module.exports = router;
