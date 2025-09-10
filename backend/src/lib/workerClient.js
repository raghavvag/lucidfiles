const axios = require('axios');
const { WORKER_URL } = require('../config');

const client = axios.create({ baseURL: WORKER_URL, timeout: 60_000 });

module.exports = {
  indexDirectory(path) {
    return client.post('/index-directory', { path });
  },
  indexFile(path) {
    return client.post('/index-file', { path });
  },
  reindexFile(path) {
    return client.post('/reindex-file', { path });
  },
  removeFile(path) {
    return client.delete('/remove-file', { data: { path } });
  },
  search(query, top_k=5) {
    return client.post('/search', { query, top_k });
  },
  preview(path) {
    return client.get('/preview', { params: { path } });
  },
  ask(question, top_k=5) {
    return client.post('/ask', { question, top_k });
  }
};
