const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');
const db = new Database(DB_PATH);

// Initialize database tables
function initializeDatabase() {
  // Create directories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS directories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      added_at TEXT NOT NULL
    )
  `);

  // Create files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      dir_id INTEGER,
      checksum TEXT,
      last_indexed TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (dir_id) REFERENCES directories (id)
    )
  `);

  console.log('✅ 🗃️ Database tables initialized successfully');
}

// Initialize database on module load
console.log('🗃️ Initializing SQLite database...');
initializeDatabase();

module.exports = {
  addDirectory(path) {
    const stmt = db.prepare("INSERT OR IGNORE INTO directories (path, added_at) VALUES (?, datetime('now'))");
    stmt.run(path);
    const row = db.prepare('SELECT * FROM directories WHERE path = ?').get(path);
    return row;
  },
  getDirectories() {
    return db.prepare('SELECT * FROM directories').all();
  },
  listDirectories() {
    return db.prepare('SELECT * FROM directories').all();
  },
  deleteDirectory(id) {
    return db.prepare('DELETE FROM directories WHERE id = ?').run(id);
  },
  removeDirectory(path) {
    db.prepare('DELETE FROM directories WHERE path = ?').run(path);
  },
  upsertFile(file) {
    const stmt = db.prepare(`
      INSERT INTO files (path, dir_id, checksum, last_indexed, status)
      VALUES (@path, @dir_id, @checksum, @last_indexed, @status)
      ON CONFLICT(path) DO UPDATE SET checksum=@checksum, last_indexed=@last_indexed, status=@status
    `);
    stmt.run(file);
  },
  removeFile(path) {
    db.prepare('DELETE FROM files WHERE path = ?').run(path);
  },
  getFile(path) {
    return db.prepare('SELECT * FROM files WHERE path = ?').get(path);
  }
};
