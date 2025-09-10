const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');
const db = new Database(DB_PATH);

module.exports = {
  addDirectory(path) {
    const stmt = db.prepare('INSERT OR IGNORE INTO directories (path, added_at) VALUES (?, datetime("now"))');
    stmt.run(path);
    const row = db.prepare('SELECT * FROM directories WHERE path = ?').get(path);
    return row;
  },
  listDirectories() {
    return db.prepare('SELECT * FROM directories').all();
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
