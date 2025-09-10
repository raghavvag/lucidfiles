const app = require('./app');
const { PORT } = require('./config');

const server = app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
const watcherManager = require('./watcher/watcherManager');
process.on('SIGINT', async () => {
  console.log('Shutting down watchers...');
  watcherManager.status().forEach(p => watcherManager.stopWatcher(p));
  // close DB if needed (better-sqlite3 auto-closes on process exit)
  process.exit(0);
});
