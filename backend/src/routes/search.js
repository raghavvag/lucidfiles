const express = require('express');
const router = express.Router();
const worker = require('../lib/workerClient');

router.post('/search', async (req, res) => {
  const { query, top_k = 5 } = req.body;
  try {
    const { data } = await worker.search(query, top_k);
    res.json({ ok: true, results: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ask', async (req, res) => {
  const { question, top_k = 5 } = req.body;
  try {
    const { data } = await worker.ask(question, top_k);
    res.json({ ok: true, answer: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
