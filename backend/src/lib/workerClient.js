const axios = require('axios');
const { WORKER_URL } = require('../config');

const client = axios.create({ baseURL: WORKER_URL, timeout: 60_000 });

// Add request/response interceptors for logging
client.interceptors.request.use(
  (config) => {
    console.log(`🔄 → Worker API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ → Worker API request error:', error.message);
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => {
    console.log(`✅ ← Worker API: ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'no response';
    console.error(`❌ ← Worker API: ${method} ${url} (${status}) - ${error.message}`);
    return Promise.reject(error);
  }
);

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
