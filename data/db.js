import Database from 'better-sqlite3';
import path from 'node:path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(
    path.join(__dirname, 'database.sqlite')
);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;