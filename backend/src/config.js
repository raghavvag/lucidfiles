require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  WORKER_URL: process.env.WORKER_URL || 'https://5f7237491f5f.ngrok-free.app',
  DB_PATH: process.env.DB_PATH || './data/sfe.db',
};
