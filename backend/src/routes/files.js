const express = require('express');
const router = express.Router();
const worker = require('../lib/workerClient');
const db = require('../db');

router.post('/index-file', async (req, res) => {
  const { path } = req.body;
  try {
    const { data } = await worker.indexFile(path);
    db.upsertFile({ path, dir_id: null, checksum: data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
    res.json({ ok: true, result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reindex-file', async (req, res) => {
  const { path } = req.body;
  try {
    const { data } = await worker.reindexFile(path);
    db.upsertFile({ path, dir_id: null, checksum: data.checksum || null, last_indexed: new Date().toISOString(), status: 'indexed' });
    res.json({ ok: true, result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/remove-file', async (req, res) => {
  const { path } = req.body;
  try {
    await worker.removeFile(path);
    db.removeFile(path);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
