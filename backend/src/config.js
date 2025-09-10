require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  WORKER_URL: process.env.WORKER_URL || 'http://0.0.0.0:8081',
  DB_PATH: process.env.DB_PATH || './data/sfe.db',
};
