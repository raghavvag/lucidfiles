require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  WORKER_URL: process.env.WORKER_URL || 'http://localhost:5000',
  DB_PATH: process.env.DB_PATH || './data/sfe.db',
};
